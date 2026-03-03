#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const packageJson = readJson('package.json');
const pluginFile = readText('dewey.php');
const readmeTxt = readText('readme.txt');
const readmeMd = readText('README.md');

const packageVersion = packageJson.version || '';
const pluginVersion = match(pluginFile, /^\s*\*\s*Version:\s*(.+)\s*$/m);
const requiresWp = match(pluginFile, /^\s*\*\s*Requires at least:\s*(.+)\s*$/m);
const requiresPhp = match(pluginFile, /^\s*\*\s*Requires PHP:\s*(.+)\s*$/m);

const stableTag = match(readmeTxt, /^Stable tag:\s*(.+)\s*$/m);
const txtRequiresWp = match(readmeTxt, /^Requires at least:\s*(.+)\s*$/m);
const txtRequiresPhp = match(readmeTxt, /^Requires PHP:\s*(.+)\s*$/m);
const testedUpTo = match(readmeTxt, /^Tested up to:\s*(.+)\s*$/m);

const mdWpRequirement = readmeMd.includes(`WordPress \`${requiresWp}+\``);
const mdPhpRequirement = readmeMd.includes(`PHP \`${requiresPhp}+\``);

assertEqual('package.json version', packageVersion, pluginVersion);
assertEqual('readme.txt stable tag', stableTag, packageVersion);
assertEqual('readme.txt Requires at least', txtRequiresWp, requiresWp);
assertEqual('readme.txt Requires PHP', txtRequiresPhp, requiresPhp);
assertTrue('readme.txt Tested up to is present', Boolean(testedUpTo));
assertTrue(
	'README.md contains WordPress requirement line',
	mdWpRequirement
);
assertTrue('README.md contains PHP requirement line', mdPhpRequirement);

console.log('Documentation consistency checks passed.');

function readText(relPath) {
	return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
	return JSON.parse(readText(relPath));
}

function match(content, pattern) {
	const value = content.match(pattern);
	return value && value[1] ? value[1].trim() : '';
}

function assertEqual(label, actual, expected) {
	if (actual === expected) {
		return;
	}
	fail(`${label} mismatch: expected "${expected}" but found "${actual}"`);
}

function assertTrue(label, condition) {
	if (condition) {
		return;
	}
	fail(`${label} check failed.`);
}

function fail(message) {
	console.error(message);
	process.exit(1);
}
