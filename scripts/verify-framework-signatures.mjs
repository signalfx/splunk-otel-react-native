#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin') {
  console.error(
    JSON.stringify({
      check: 'framework-signatures',
      status: 'failed',
      errors: ['Framework signatures must be verified on macOS'],
    })
  );
  process.exit(1);
}

const frameworksRoot = resolve(
  process.cwd(),
  'packages',
  'core',
  'ios',
  'frameworks'
);
const command = process.argv[2] ?? '--check';
const codeObjects = [];

if (command !== '--check' && command !== '--normalize') {
  console.error(
    JSON.stringify({
      check: 'framework-signatures',
      status: 'failed',
      errors: [`Unsupported argument: ${command}`],
    })
  );
  process.exit(2);
}

const collectFrameworks = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed: ${entryPath}`);
    }

    if (!entry.isDirectory()) {
      continue;
    }

    if (
      entry.name.endsWith('.framework') ||
      entry.name.endsWith('.xcframework')
    ) {
      codeObjects.push(entryPath);
    }

    collectFrameworks(entryPath);
  }
};

collectFrameworks(frameworksRoot);
codeObjects.sort();

const failures = [];
let signed = 0;
let unsigned = 0;

const verify = (codeObject) =>
  spawnSync(
    '/usr/bin/codesign',
    ['--verify', '--deep', '--strict', '--verbose=2', codeObject],
    {
      encoding: 'utf8',
      shell: false,
      timeout: 30_000,
    }
  );

for (const codeObject of codeObjects) {
  let result = verify(codeObject);
  let reason = result.stderr.trim();

  if (result.status === 0) {
    signed += 1;
    continue;
  }

  if (reason.includes('code object is not signed at all')) {
    unsigned += 1;
    continue;
  }

  if (command === '--normalize') {
    const removal = spawnSync(
      '/usr/bin/codesign',
      ['--remove-signature', codeObject],
      {
        encoding: 'utf8',
        shell: false,
        timeout: 30_000,
      }
    );

    if (removal.status === 0) {
      result = verify(codeObject);
      reason = result.stderr.trim();

      if (
        result.status !== 0 &&
        reason.includes('code object is not signed at all')
      ) {
        unsigned += 1;
        continue;
      }
    } else {
      reason = removal.stderr.trim();
    }
  }

  if (result.status !== 0) {
    failures.push({
      codeObject,
      reason: reason || `codesign exited with ${result.status}`,
    });
  }
}

if (failures.length > 0) {
  console.error(
    JSON.stringify({
      check: 'framework-signatures',
      status: 'failed',
      failures,
    })
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      check: 'framework-signatures',
      status: 'passed',
      codeObjects: codeObjects.length,
      signed,
      unsigned,
    })
  );
}
