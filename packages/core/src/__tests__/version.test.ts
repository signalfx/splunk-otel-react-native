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

let mockConstants: any = {
  reactNativeVersion: { major: 0, minor: 81, patch: 1 },
};

jest.mock('react-native', () => ({
  Platform: {
    get constants() {
      return mockConstants;
    },
  },
}));

import {
  SDK_VERSION,
  ATTR_RN_FRAMEWORK_VERSION,
  ATTR_RN_SDK_VERSION,
  getReactNativeVersion,
  getSdkVersion,
  getSdkVersionInfo,
} from '../version';

const corePackageJson = require('../../package.json');

describe('version', () => {
  beforeEach(() => {
    mockConstants = {
      reactNativeVersion: { major: 0, minor: 81, patch: 1 },
    };
  });

  describe('SDK_VERSION', () => {
    it('is a non-empty semver string', () => {
      expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('matches package.json version', () => {
      expect(SDK_VERSION).toBe(corePackageJson.version);
    });
  });

  describe('attribute key constants', () => {
    it('ATTR_RN_FRAMEWORK_VERSION has the expected key', () => {
      expect(ATTR_RN_FRAMEWORK_VERSION).toBe(
        'splunk.app.framework.rn.version'
      );
    });

    it('ATTR_RN_SDK_VERSION has the expected key', () => {
      expect(ATTR_RN_SDK_VERSION).toBe('rum.sdk.rn.version');
    });
  });

  describe('getReactNativeVersion()', () => {
    it('returns major.minor.patch from Platform.constants', () => {
      mockConstants = {
        reactNativeVersion: { major: 0, minor: 81, patch: 1 },
      };

      expect(getReactNativeVersion()).toBe('0.81.1');
    });

    it('includes prerelease suffix when present', () => {
      mockConstants = {
        reactNativeVersion: {
          major: 0,
          minor: 82,
          patch: 0,
          prerelease: 'rc.1',
        },
      };

      expect(getReactNativeVersion()).toBe('0.82.0-rc.1');
    });

    it('omits prerelease when it is null', () => {
      mockConstants = {
        reactNativeVersion: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: null,
        },
      };

      expect(getReactNativeVersion()).toBe('1.0.0');
    });

    it('omits prerelease when it is an empty string', () => {
      mockConstants = {
        reactNativeVersion: {
          major: 0,
          minor: 75,
          patch: 3,
          prerelease: '',
        },
      };

      expect(getReactNativeVersion()).toBe('0.75.3');
    });

    it('handles zero-value version components', () => {
      mockConstants = {
        reactNativeVersion: { major: 0, minor: 0, patch: 0 },
      };

      expect(getReactNativeVersion()).toBe('0.0.0');
    });

    it('handles large version numbers', () => {
      mockConstants = {
        reactNativeVersion: { major: 1, minor: 0, patch: 0 },
      };

      expect(getReactNativeVersion()).toBe('1.0.0');
    });

    it('returns "unknown" when reactNativeVersion is missing', () => {
      mockConstants = {};

      expect(getReactNativeVersion()).toBe('unknown');
    });

    it('returns "unknown" when constants is undefined', () => {
      mockConstants = undefined;

      expect(getReactNativeVersion()).toBe('unknown');
    });

    it('returns "unknown" when constants is null', () => {
      mockConstants = null;

      expect(getReactNativeVersion()).toBe('unknown');
    });
  });

  describe('getSdkVersion()', () => {
    it('returns the SDK_VERSION constant', () => {
      expect(getSdkVersion()).toBe(SDK_VERSION);
    });

    it('is a string', () => {
      expect(typeof getSdkVersion()).toBe('string');
    });
  });

  describe('getSdkVersionInfo()', () => {
    it('returns an object with both version fields', () => {
      mockConstants = {
        reactNativeVersion: { major: 0, minor: 81, patch: 1 },
      };

      const info = getSdkVersionInfo();

      expect(info).toEqual({
        reactNativeVersion: '0.81.1',
        sdkVersion: SDK_VERSION,
      });
    });

    it('reactNativeVersion reflects the current Platform constants', () => {
      mockConstants = {
        reactNativeVersion: { major: 0, minor: 79, patch: 0 },
      };

      expect(getSdkVersionInfo().reactNativeVersion).toBe('0.79.0');
    });

    it('sdkVersion is always the SDK_VERSION constant', () => {
      expect(getSdkVersionInfo().sdkVersion).toBe(SDK_VERSION);
    });

    it('returns "unknown" RN version when Platform is unavailable', () => {
      mockConstants = undefined;

      const info = getSdkVersionInfo();
      expect(info.reactNativeVersion).toBe('unknown');
      expect(info.sdkVersion).toBe(SDK_VERSION);
    });
  });
});
