#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const frameworksRoot = resolve(root, 'packages', 'core', 'ios', 'frameworks');
const manifestPath = resolve(frameworksRoot, 'manifest.json');
const command = process.argv[2] ?? '--check';

if (command !== '--check' && command !== '--write') {
  console.error(
    JSON.stringify({
      check: 'framework-integrity',
      status: 'failed',
      errors: [`Unsupported argument: ${command}`],
    })
  );
  process.exit(2);
}

const frameworkDirectories = readdirSync(frameworksRoot, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory() && entry.name.endsWith('.xcframework'))
  .map((entry) => resolve(frameworksRoot, entry.name))
  .sort();

const collectFiles = (directory) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(
        `Symbolic links are not allowed in vendored frameworks: ${relative(
          root,
          entryPath
        )}`
      );
    }

    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const frameworks = frameworkDirectories.map((directory) => {
  const digest = createHash('sha256');
  const files = collectFiles(directory);
  let size = 0;

  for (const file of files) {
    const relativePath = relative(directory, file).split(sep).join('/');
    const contents = readFileSync(file);
    const fileDigest = createHash('sha256').update(contents).digest('hex');

    size += statSync(file).size;
    digest.update(relativePath);
    digest.update('\0');
    digest.update(fileDigest);
    digest.update('\0');
  }

  return {
    name: basename(directory, '.xcframework'),
    path: relative(root, directory).split(sep).join('/'),
    files: files.length,
    bytes: size,
    sha256: digest.digest('hex'),
  };
});

const manifest = `${JSON.stringify(
  {
    schemaVersion: 1,
    algorithm: 'sha256',
    source: {
      repository: 'signalfx/splunk-otel-ios',
      version: '2.4.1',
    },
    frameworks,
  },
  null,
  2
)}\n`;

if (command === '--write') {
  writeFileSync(manifestPath, manifest, { encoding: 'utf8', mode: 0o644 });
  console.log(
    JSON.stringify({
      check: 'framework-integrity',
      status: 'written',
      frameworks: frameworks.length,
    })
  );
} else {
  const committedManifest = readFileSync(manifestPath, 'utf8');

  if (committedManifest !== manifest) {
    console.error(
      JSON.stringify({
        check: 'framework-integrity',
        status: 'failed',
        errors: [
          'Vendored framework contents differ from packages/core/ios/frameworks/manifest.json',
        ],
      })
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify({
        check: 'framework-integrity',
        status: 'passed',
        frameworks: frameworks.length,
      })
    );
  }
}
