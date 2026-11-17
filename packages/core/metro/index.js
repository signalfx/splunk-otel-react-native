/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

const { randomUUID } = require('crypto');
const { Buffer } = require('buffer');

const PLACEHOLDER = '00000000-0000-4000-8000-000000000000';
const MODULE_PATH = '__splunk_rum_source_map_identity__';
const EXECUTABLE_SOURCE_MAP_ID_MARKER = '__splunkRumSourceMapId=';
const SOURCE_MAP_ID_COMMENT = '//# sourceMapId=';
const SOURCE_MAP_COMMENT = '//# sourceMappingURL=';

function withSplunkRumConfig(config) {
  const originalSerializer =
    config.serializer && config.serializer.customSerializer;
  return {
    ...config,
    serializer: {
      ...(config.serializer || {}),
      customSerializer: createSerializer(originalSerializer),
    },
  };
}

function createSerializer(originalSerializer) {
  const serializer = originalSerializer || createDefaultSerializer();
  return async (entryPoint, preModules, graph, options) => {
    const isDevelopment =
      'hot' in graph.transformOptions
        ? graph.transformOptions.hot
        : graph.transformOptions.dev;
    if (isDevelopment) {
      return serializer(entryPoint, preModules, graph, options);
    }

    const registrationModule = createVirtualModule(
      createRegistrationSnippet(PLACEHOLDER)
    );
    const result = await serializer(
      entryPoint,
      prependAfterPrelude(preModules, registrationModule),
      graph,
      options
    );
    const serialized =
      typeof result === 'string' ? { code: result, map: '{}' } : result;
    const sourceMapId = randomUUID();
    const codeWithIdentity = addSourceMapIdComment(
      serialized.code.split(PLACEHOLDER).join(sourceMapId),
      sourceMapId
    );
    const sourceMap = JSON.parse(serialized.map || '{}');
    replacePlaceholderRecursively(sourceMap, sourceMapId);
    sourceMap.sourceMapId = sourceMapId;
    return { code: codeWithIdentity, map: JSON.stringify(sourceMap) };
  };
}

function createRegistrationSnippet(sourceMapId) {
  return `globalThis.__splunkRumSourceMapRegistrations??={};try{globalThis.__splunkRumSourceMapRegistrations[(new Error).stack]="${sourceMapId}";Object.defineProperty(globalThis.__splunkRumSourceMapRegistrations,"${EXECUTABLE_SOURCE_MAP_ID_MARKER}${sourceMapId}",{value:true})}catch(e){}`;
}

function addSourceMapIdComment(code, sourceMapId) {
  const comment = `${SOURCE_MAP_ID_COMMENT}${sourceMapId}`;
  const sourceMapIndex = code.lastIndexOf(SOURCE_MAP_COMMENT);
  return sourceMapIndex < 0
    ? `${code}\n${comment}`
    : `${code.substring(0, sourceMapIndex)}${comment}\n${code.substring(sourceMapIndex)}`;
}

function replacePlaceholderRecursively(value, sourceMapId) {
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    const child = value[key];
    if (typeof child === 'string') {
      value[key] = child.split(PLACEHOLDER).join(sourceMapId);
    } else {
      replacePlaceholderRecursively(child, sourceMapId);
    }
  }
}

function prependAfterPrelude(preModules, module) {
  const result = [...preModules];
  if (result.length > 0 && result[0].path === '__prelude__') {
    result.splice(1, 0, module);
  } else {
    result.unshift(module);
  }
  return result;
}

function createVirtualModule(code) {
  return {
    dependencies: new Map(),
    getSource: () => Buffer.from(code),
    inverseDependencies: new Set(),
    path: MODULE_PATH,
    output: [
      {
        type: 'js/script/virtual',
        data: { code, lineCount: 1, map: [] },
      },
    ],
  };
}

function createDefaultSerializer() {
  const baseModule = loadMetroModule('DeltaBundler/Serializers/baseJSBundle');
  const mapModule = loadMetroModule('DeltaBundler/Serializers/sourceMapString');
  const bundleModule = loadMetroLibModule('bundleToString');
  const baseJSBundle = functionExport(baseModule, 'baseJSBundle');
  const sourceMapString = functionExport(mapModule, 'sourceMapString');
  const bundleToString = functionExport(bundleModule, 'bundleToString');

  return (entryPoint, preModules, graph, options) => {
    const bundle = baseJSBundle(entryPoint, preModules, graph, options);
    const { code } = bundleToString(bundle);
    const modules = [...graph.dependencies.values()].sort(
      (left, right) =>
        options.createModuleId(left.path) - options.createModuleId(right.path)
    );
    const map = sourceMapString([...preModules, ...modules], {
      processModuleFilter: options.processModuleFilter,
      shouldAddToIgnoreList: options.shouldAddToIgnoreList || (() => false),
    });
    return { code, map };
  };
}

function loadMetroModule(relativePath) {
  try {
    return require(`metro/private/${relativePath}`);
  } catch {
    return require(`metro/src/${relativePath}`);
  }
}

function loadMetroLibModule(name) {
  try {
    return require(`metro/private/lib/${name}`);
  } catch {
    return require(`metro/src/lib/${name}`);
  }
}

function functionExport(moduleValue, name) {
  const value =
    typeof moduleValue === 'function'
      ? moduleValue
      : moduleValue[name] || moduleValue.default;
  if (typeof value !== 'function') {
    throw new Error(
      `[@splunk/otel-react-native/metro] Unable to load Metro ${name}.`
    );
  }
  return value;
}

module.exports = { withSplunkRumConfig };
