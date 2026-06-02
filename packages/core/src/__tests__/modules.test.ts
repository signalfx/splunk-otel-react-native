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

import { NetworkInstrumentationModuleConfiguration } from '../model/modules/NetworkInstrumentationModuleConfiguration';
import { HttpURLModuleConfiguration } from '../model/modules/HttpURLModuleConfiguration';
import { OkHttp3AutoModuleConfiguration } from '../model/modules/OkHttp3AutoModuleConfiguration';
import { OkHttp3ManualModuleConfiguration } from '../model/modules/OkHttp3ManualModuleConfiguration';

describe('NetworkInstrumentationModuleConfiguration (iOS)', () => {
  it('maps enabled and ignoreURLs (string)', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(true, '.*\\.png$');

    expect(cfg.toNative()).toEqual({
      name: 'networkInstrumentation',
      attributes: { enabled: 'true', ignoreURLs: '.*\\.png$' },
    });
  });

  it('maps ignoreURLs array into OR regex', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(true, [
      '.*\\.png$',
      '.*/health$',
    ]);

    expect(cfg.toNative()).toEqual({
      name: 'networkInstrumentation',
      attributes: { enabled: 'true', ignoreURLs: '.*\\.png$|.*/health$' },
    });
  });

  it('maps captured request and response headers', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(
      true,
      undefined,
      ['Content-Encoding', 'Accept'],
      ['Content-Encoding', 'Content-Type']
    );

    expect(cfg.toNative()).toEqual({
      name: 'networkInstrumentation',
      attributes: {
        enabled: 'true',
        requestHeaders: 'Content-Encoding, Accept',
        responseHeaders: 'Content-Encoding, Content-Type',
      },
    });
  });

  it('omits empty header lists', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(true);

    const result = cfg.toNative();
    expect(result.attributes).not.toHaveProperty('requestHeaders');
    expect(result.attributes).not.toHaveProperty('responseHeaders');
  });

  it('supports all options together', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(
      false,
      '.*\\.svg$',
      ['X-Request-ID'],
      ['Content-Encoding']
    );

    expect(cfg.toNative()).toEqual({
      name: 'networkInstrumentation',
      attributes: {
        enabled: 'false',
        ignoreURLs: '.*\\.svg$',
        requestHeaders: 'X-Request-ID',
        responseHeaders: 'Content-Encoding',
      },
    });
  });

  it('sanitizes headers (trims, deduplicates, rejects invalid)', () => {
    const cfg = new NetworkInstrumentationModuleConfiguration(
      true,
      undefined,
      ['  Accept  ', 'accept', '', 'bad name'],
      ['Content-Type', 'Authorization: Bearer x']
    );

    expect(cfg.toNative()).toEqual({
      name: 'networkInstrumentation',
      attributes: {
        enabled: 'true',
        requestHeaders: 'Accept',
        responseHeaders: 'Content-Type',
      },
    });
  });
});

describe('HttpURLModuleConfiguration (Android)', () => {
  it('maps headers with sanitization', () => {
    const cfg = new HttpURLModuleConfiguration(
      true,
      ['Content-Type', '  Accept  ', 'content-type'],
      ['Server', '']
    );

    expect(cfg.toNative()).toEqual({
      name: 'httpURLConnection',
      attributes: {
        enabled: 'true',
        requestHeaders: 'Content-Type, Accept',
        responseHeaders: 'Server',
      },
    });
  });
});

describe('OkHttp3AutoModuleConfiguration (Android)', () => {
  it('maps headers with sanitization', () => {
    const cfg = new OkHttp3AutoModuleConfiguration(
      true,
      ['Content-Type', 'bad header'],
      ['Server']
    );

    expect(cfg.toNative()).toEqual({
      name: 'okHttp3-auto',
      attributes: {
        enabled: 'true',
        requestHeaders: 'Content-Type',
        responseHeaders: 'Server',
      },
    });
  });
});

describe('OkHttp3ManualModuleConfiguration (Android)', () => {
  it('maps headers with sanitization', () => {
    const cfg = new OkHttp3ManualModuleConfiguration(
      ['X-Request-ID', '', '  '],
      ['Content-Encoding']
    );

    expect(cfg.toNative()).toEqual({
      name: 'okHttp3-manual',
      attributes: {
        requestHeaders: 'X-Request-ID',
        responseHeaders: 'Content-Encoding',
      },
    });
  });
});
