#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPaths = [
  'package.json',
  'example/package.json',
  'packages/core/package.json',
  'packages/session-replay/package.json',
];
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const frozenPlatformVersions = new Map([
  ['react', '19.2.3'],
  ['react-native', '0.86.2'],
]);
const errors = [];

for (const manifestPath of manifestPaths) {
  const manifest = JSON.parse(
    readFileSync(resolve(root, manifestPath), 'utf8')
  );

  for (const dependencyType of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ]) {
    for (const [name, version] of Object.entries(
      manifest[dependencyType] ?? {}
    )) {
      if (!exactVersion.test(version) && !version.startsWith('workspace:')) {
        errors.push(
          `${manifestPath}: ${dependencyType}.${name} must use an exact or workspace version, found ${version}`
        );
      }

      let frozenVersion = frozenPlatformVersions.get(name);
      if (!frozenVersion && name.startsWith('@react-native/')) {
        frozenVersion = '0.86.2';
      }

      if (frozenVersion && version !== frozenVersion) {
        errors.push(
          `${manifestPath}: ${dependencyType}.${name} must remain at ${frozenVersion}, found ${version}`
        );
      }
    }
  }

  for (const [name, version] of Object.entries(manifest.resolutions ?? {})) {
    if (!exactVersion.test(version)) {
      errors.push(
        `${manifestPath}: resolutions.${name} must use an exact version, found ${version}`
      );
    }
  }

  if (manifestPath === 'package.json') {
    for (const [name, frozenVersion] of frozenPlatformVersions) {
      if (manifest.resolutions?.[name] !== frozenVersion) {
        errors.push(
          `${manifestPath}: resolutions.${name} must remain at ${frozenVersion}`
        );
      }
    }
  }
}

const yarnConfig = readFileSync(resolve(root, '.yarnrc.yml'), 'utf8');
const requiredYarnSettings = [
  ['dependency scripts disabled', /^enableScripts:\s+false$/m],
  ['immutable installs enabled', /^enableImmutableInstalls:\s+true$/m],
  ['checksum failures enabled', /^checksumBehavior:\s+throw$/m],
  [
    'official npm registry configured',
    /^npmRegistryServer:\s+["']https:\/\/registry\.npmjs\.org["']$/m,
  ],
  ['dependency cooldown configured', /^npmMinimalAgeGate:\s+7d$/m],
];

for (const [description, pattern] of requiredYarnSettings) {
  if (!pattern.test(yarnConfig)) {
    errors.push(`.yarnrc.yml: ${description}`);
  }
}

if (/npmAuth(?:Token|Ident):/m.test(yarnConfig)) {
  errors.push(
    '.yarnrc.yml: repository configuration must not contain npm credentials'
  );
}

const exceptionPolicy = JSON.parse(
  readFileSync(resolve(root, 'security/audit-exceptions.json'), 'utf8')
);
const configuredExceptionIds =
  yarnConfig
    .match(/npmAuditIgnoreAdvisories:\n((?:\s+-\s+["']\d+["']\n?)+)/)?.[1]
    ?.match(/\d+/g) ?? [];
const documentedExceptionIds = exceptionPolicy.exceptions.map(
  (exception) => exception.id
);
const now = Date.now();
const maximumExceptionLifetime = 90 * 24 * 60 * 60 * 1000;

for (const exception of exceptionPolicy.exceptions) {
  const expires = Date.parse(`${exception.expires}T23:59:59Z`);

  if (!configuredExceptionIds.includes(exception.id)) {
    errors.push(
      `security/audit-exceptions.json: advisory ${exception.id} is documented but not configured`
    );
  }

  if (!exception.owner || !exception.reason) {
    errors.push(
      `security/audit-exceptions.json: advisory ${exception.id} requires an owner and reason`
    );
  }

  if (
    !Number.isFinite(expires) ||
    expires <= now ||
    expires - now > maximumExceptionLifetime
  ) {
    errors.push(
      `security/audit-exceptions.json: advisory ${exception.id} must expire within 90 days`
    );
  }
}

for (const exceptionId of configuredExceptionIds) {
  if (!documentedExceptionIds.includes(exceptionId)) {
    errors.push(
      `.yarnrc.yml: ignored advisory ${exceptionId} requires a documented exception`
    );
  }
}

const lockfile = readFileSync(resolve(root, 'yarn.lock'), 'utf8');
const forbiddenSources = [
  'exec:',
  'file:',
  'git+',
  'git:',
  'github:',
  'http:',
  'https:',
  'portal:',
];

for (const line of lockfile.split('\n')) {
  if (!line.trimStart().startsWith('resolution:')) {
    continue;
  }

  for (const source of forbiddenSources) {
    if (line.includes(source)) {
      errors.push(`yarn.lock: forbidden dependency source ${source}`);
    }
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      check: 'dependency-policy',
      status: 'failed',
      errors,
    })
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      check: 'dependency-policy',
      status: 'passed',
      manifests: manifestPaths.length,
    })
  );
}
