#!/usr/bin/env node

import { readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = process.cwd();
const nodeModulesRoot = resolve(root, 'node_modules');
const approvedBindingGypPackages = new Set();
const bindingGypFiles = [];

async function scanDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.name === '.bin') {
      continue;
    }

    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      await scanDirectory(entryPath);
    } else if (entry.isFile() && entry.name === 'binding.gyp') {
      bindingGypFiles.push(relative(root, entryPath));
    }
  }
}

function packageNameFor(bindingGypPath) {
  const segments = bindingGypPath.split('/');
  const nodeModulesIndex = segments.lastIndexOf('node_modules');
  const firstPackageSegment = segments[nodeModulesIndex + 1];

  if (firstPackageSegment && firstPackageSegment.startsWith('@')) {
    return `${firstPackageSegment}/${segments[nodeModulesIndex + 2]}`;
  }

  return firstPackageSegment;
}

try {
  await scanDirectory(nodeModulesRoot);
} catch (error) {
  console.error(
    JSON.stringify({
      check: 'install-artifacts',
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
}

const unapprovedBindingGypFiles = bindingGypFiles.filter((filePath) => {
  const packageName = packageNameFor(filePath);
  return !packageName || !approvedBindingGypPackages.has(packageName);
});

if (unapprovedBindingGypFiles.length > 0) {
  console.error(
    JSON.stringify({
      check: 'install-artifacts',
      status: 'failed',
      reason:
        'Unapproved binding.gyp files can execute commands through node-gyp',
      files: unapprovedBindingGypFiles,
    })
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    check: 'install-artifacts',
    status: 'passed',
    approvedBindingGypFiles: bindingGypFiles.length,
  })
);
