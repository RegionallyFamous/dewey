#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const phpFiles = collectPhpFiles(ROOT);
const jsFiles = collectJsFiles(path.join(ROOT, 'src'));
const banned = [
	{ name: 'eval', pattern: /\beval\s*\(/ },
	{ name: 'assert', pattern: /\bassert\s*\(/ },
	{ name: 'create_function', pattern: /\bcreate_function\s*\(/ },
	{ name: 'shell_exec', pattern: /\bshell_exec\s*\(/ },
	{ name: 'exec', pattern: /\bexec\s*\(/ },
	{ name: 'passthru', pattern: /\bpassthru\s*\(/ },
	{ name: 'system', pattern: /\bsystem\s*\(/ },
	{ name: 'base64_decode', pattern: /\bbase64_decode\s*\(/ },
	{ name: 'unserialize', pattern: /\bunserialize\s*\(/ },
	{
		name: 'dynamic include from superglobal',
		pattern: /\b(?:require|include)(?:_once)?\s*\(?\s*\$_(?:GET|POST|REQUEST|COOKIE|SERVER)\b/,
	},
	{
		name: 'preg_replace /e modifier',
		pattern: /\bpreg_replace\s*\(\s*(['"]).*?\/e\1/s,
	},
];

for (const relPath of phpFiles) {
	const fullPath = path.join(ROOT, relPath);
	const content = fs.readFileSync(fullPath, 'utf8');

	for (const rule of banned) {
		if (rule.pattern.test(content)) {
			console.error(
				`Security check failed: found "${rule.name}" in ${relPath}`
			);
			process.exit(1);
		}
	}
}

const jsBanned = [
	{ name: 'eval', pattern: /\beval\s*\(/ },
	{ name: 'Function constructor', pattern: /\bnew\s+Function\s*\(/ },
	{ name: 'dangerouslySetInnerHTML', pattern: /\bdangerouslySetInnerHTML\b/ },
	{
		name: 'innerHTML assignment',
		pattern: /\.\s*innerHTML\s*=/,
	},
	{
		name: 'outerHTML assignment',
		pattern: /\.\s*outerHTML\s*=/,
	},
];

for (const relPath of jsFiles) {
	const fullPath = path.join(ROOT, relPath);
	const content = fs.readFileSync(fullPath, 'utf8');

	for (const rule of jsBanned) {
		if (rule.pattern.test(content)) {
			console.error(
				`Security check failed: found "${rule.name}" in ${relPath}`
			);
			process.exit(1);
		}
	}
}

console.log('Security baseline checks passed.');

function collectPhpFiles(rootDir) {
	const includeRoots = ['dewey.php', 'includes', 'build'];
	const files = [];

	for (const relRoot of includeRoots) {
		const fullRoot = path.join(rootDir, relRoot);
		if (!fs.existsSync(fullRoot)) {
			continue;
		}

		const stat = fs.statSync(fullRoot);
		if (stat.isFile() && relRoot.endsWith('.php')) {
			files.push(relRoot);
			continue;
		}

		if (stat.isDirectory()) {
			walk(fullRoot, rootDir, files);
		}
	}

	return files;
}

function collectJsFiles(rootDir) {
	const files = [];
	if (!fs.existsSync(rootDir)) {
		return files;
	}

	walk(rootDir, ROOT, files, ['.js', '.jsx']);
	return files;
}

function walk(currentDir, rootDir, files, extensions = ['.php']) {
	for (const entry of fs.readdirSync(currentDir)) {
		const fullPath = path.join(currentDir, entry);
		const relPath = path.relative(rootDir, fullPath);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			walk(fullPath, rootDir, files, extensions);
			continue;
		}

		if (extensions.some((extension) => relPath.endsWith(extension))) {
			files.push(relPath);
		}
	}
}
