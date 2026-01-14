/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

let localConfig: Partial<AppConfig> = {};
try {
  localConfig = require('./config.local').default;
} catch {
  // Local config not found, will use defaults/env vars
}

export interface AppConfig {
  realm: string;

  rumAccessToken: string;

  appName: string;

  deploymentEnvironment: string;

  enableDebugLogging: boolean;
}

/**
 * Environment variables are injected at build time by babel.
 */
const getEnvVar = (name: string): string | undefined => {
  const envVars: Record<string, string | undefined> = {
    SPLUNK_REALM: process.env.SPLUNK_REALM,
    SPLUNK_RUM_ACCESS_TOKEN: process.env.SPLUNK_RUM_ACCESS_TOKEN,
    SPLUNK_APP_NAME: process.env.SPLUNK_APP_NAME,
    SPLUNK_ENVIRONMENT: process.env.SPLUNK_ENVIRONMENT,
  };
  return envVars[name];
};

/**
 * Default configuration with environment variable overrides
 */
const defaultConfig: AppConfig = {
  realm: 'us0',
  rumAccessToken: '',
  appName: 'Splunk RN Test App',
  deploymentEnvironment: 'dev',
  enableDebugLogging: true,
};

export const config: AppConfig = {
  realm: getEnvVar('SPLUNK_REALM') || localConfig.realm || defaultConfig.realm,
  rumAccessToken:
    getEnvVar('SPLUNK_RUM_ACCESS_TOKEN') ||
    localConfig.rumAccessToken ||
    defaultConfig.rumAccessToken,
  appName:
    getEnvVar('SPLUNK_APP_NAME') ||
    localConfig.appName ||
    defaultConfig.appName,
  deploymentEnvironment:
    getEnvVar('SPLUNK_ENVIRONMENT') ||
    localConfig.deploymentEnvironment ||
    defaultConfig.deploymentEnvironment,
  enableDebugLogging:
    localConfig.enableDebugLogging ?? defaultConfig.enableDebugLogging,
};

/**
 * Check if the configuration is valid for running the SDK
 */
export const isConfigValid = (): boolean => {
  return config.rumAccessToken.length > 0 && config.realm.length > 0;
};
