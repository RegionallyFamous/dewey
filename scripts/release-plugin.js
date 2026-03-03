#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'releases');
const STAGE_PLUGIN_DIR = 'dewey';
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const argv = process.argv.slice(2);
const isDryRun = argv.includes('--dry-run');
const skipBuild = argv.includes('--skip-build');
const skipChecks = argv.includes('--skip-checks');
const versionArg = argv.find((arg) => !arg.startsWith('--'));

if (!versionArg) {
	exitWithHelp('Missing version argument.');
}

if (!semverPattern.test(versionArg)) {
	exitWithHelp(`Invalid version "${versionArg}". Use semver like 1.2.3 or 1.2.3-beta.1.`);
}

const packageJsonPath = path.join(ROOT, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
	console.error('No package.json found in current directory.');
	process.exit(1);
}

let pluginSlug = 'dewey';
let packageVersion = '';
try {
	const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
	if (pkg && typeof pkg.name === 'string' && pkg.name.trim() !== '') {
		pluginSlug = pkg.name.trim();
	}
	if (pkg && typeof pkg.version === 'string' && pkg.version.trim() !== '') {
		packageVersion = pkg.version.trim();
	}
} catch (err) {
	console.error(`Unable to parse package.json: ${err.message}`);
	process.exit(1);
}

if (!slugPattern.test(pluginSlug)) {
	console.error(
		`Invalid plugin slug "${pluginSlug}". Use lowercase letters, numbers, and hyphens only.`
	);
	process.exit(1);
}

const requiredPaths = ['build', 'includes', 'readme.txt'];
const pluginEntryCandidates = [
	'dewey.php',
	`${pluginSlug}.php`,
	'plugin.php',
	'index.php',
].filter((value, index, all) => all.indexOf(value) === index);

const missingRequired = requiredPaths.filter((relPath) => !existsInRoot(relPath));
if (missingRequired.length > 0) {
	console.error(`Cannot release. Missing required paths: ${missingRequired.join(', ')}`);
	process.exit(1);
}

const pluginEntry = pluginEntryCandidates.find((relPath) => existsInRoot(relPath));
if (!pluginEntry) {
	console.error(
		'Cannot release. No plugin bootstrap file found. Expected one of: ' +
			pluginEntryCandidates.join(', ')
	);
	process.exit(1);
}

const pluginEntryPath = path.join(ROOT, pluginEntry);
const readmeTxtPath = path.join(ROOT, 'readme.txt');
const pluginEntryContents = fs.readFileSync(pluginEntryPath, 'utf8');
const readmeContents = fs.readFileSync(readmeTxtPath, 'utf8');

const pluginHeaderVersion = matchValue(
	pluginEntryContents,
	/^\s*\*\s*Version:\s*(.+)\s*$/m
);
const stableTagVersion = matchValue(readmeContents, /^Stable tag:\s*(.+)\s*$/m);

if (!packageVersion || !pluginHeaderVersion || !stableTagVersion) {
	console.error(
		'Cannot release. Missing version metadata in package.json, dewey.php, or readme.txt.'
	);
	process.exit(1);
}

if (
	packageVersion !== versionArg ||
	pluginHeaderVersion !== versionArg ||
	stableTagVersion !== versionArg
) {
	console.error(
		'Cannot release. Version mismatch detected:\n' +
			`- requested: ${versionArg}\n` +
			`- package.json: ${packageVersion}\n` +
			`- ${pluginEntry} header: ${pluginHeaderVersion}\n` +
			`- readme.txt stable tag: ${stableTagVersion}`
	);
	process.exit(1);
}

if (!skipChecks) {
	console.log('Running quality and security checks...');
	run('npm', ['run', 'lint']);
	run('npm', ['run', 'test:js']);
	run('npm', ['run', 'test:php']);
	run('npm', ['run', 'check']);
}

if (!skipBuild) {
	console.log('Building plugin assets...');
	run('npm', ['run', 'build']);
}

const releaseName = `${pluginSlug}-${versionArg}`;
const outputZip = path.join(DIST_DIR, `${releaseName}.zip`);
const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${pluginSlug}-release-`));
const stagedPluginRoot = path.join(stagingRoot, STAGE_PLUGIN_DIR);
assertPathWithin(DIST_DIR, outputZip);

fs.mkdirSync(stagedPluginRoot, { recursive: true });
fs.mkdirSync(DIST_DIR, { recursive: true });

const pathsToShip = [
	pluginEntry,
	'readme.txt',
	'build',
	'includes',
	'languages',
	'assets',
	'uninstall.php',
	'LICENSE',
	'license.txt',
];

for (const relPath of pathsToShip) {
	if (!existsInRoot(relPath)) {
		continue;
	}
	copyRecursive(path.join(ROOT, relPath), path.join(stagedPluginRoot, relPath));
}

if (fs.existsSync(outputZip)) {
	fs.unlinkSync(outputZip);
}

if (isDryRun) {
	console.log(`[dry-run] Staged release at: ${stagedPluginRoot}`);
	console.log(`[dry-run] Would create archive: ${outputZip}`);
	process.exit(0);
}

console.log(`Creating zip archive: ${outputZip}`);
run('zip', ['-rqX', outputZip, STAGE_PLUGIN_DIR], { cwd: stagingRoot });

console.log(`Release package created: ${outputZip}`);

function existsInRoot(relPath) {
	return fs.existsSync(path.join(ROOT, relPath));
}

function run(cmd, args, options = {}) {
	execFileSync(cmd, args, {
		stdio: 'inherit',
		cwd: ROOT,
		...options,
	});
}

function copyRecursive(src, dest) {
	assertPathWithin(ROOT, src);
	assertPathWithin(stagedPluginRoot, dest);
	const stat = fs.lstatSync(src);
	if (stat.isSymbolicLink()) {
		throw new Error(`Refusing to package symlink: ${src}`);
	}
	if (stat.isDirectory()) {
		fs.mkdirSync(dest, { recursive: true });
		for (const entry of fs.readdirSync(src)) {
			copyRecursive(path.join(src, entry), path.join(dest, entry));
		}
		return;
	}
	if (!stat.isFile()) {
		throw new Error(`Refusing to package non-regular file: ${src}`);
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
}

function exitWithHelp(message) {
	console.error(message);
	console.error(
		'Usage: npm run release -- <version> [--dry-run] [--skip-build] [--skip-checks]'
	);
	process.exit(1);
}

function matchValue(content, pattern) {
	const match = content.match(pattern);
	return match && match[1] ? match[1].trim() : '';
}

function assertPathWithin(parentDir, childPath) {
	const parent = path.resolve(parentDir);
	const child = path.resolve(childPath);
	const parentWithSep = `${parent}${path.sep}`;

	if (child !== parent && !child.startsWith(parentWithSep)) {
		throw new Error(`Resolved path is outside "${parent}": ${child}`);
	}
}
