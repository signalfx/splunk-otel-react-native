/*
Copyright 2023 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { getDevServer } from '../devServer/devServer';

let devServer: any = null;

describe('Http request', () => {
  before(() => {
    devServer = getDevServer({ port: 53820 });
  });

  beforeEach(() => {
    devServer.clearSpans();
  });

  it('should exist and have http attributes', async () => {
    const fetchButton = await driver.$('~fetch');
    await fetchButton.waitForDisplayed({ timeout: 15000 });
    await fetchButton.click();

    const fetchSpan = await devServer.findSpan(
      (span) => span.tags.component === 'http'
    );
    expect(fetchSpan).toBeDefined();
    expect(fetchSpan.tags['http.method']).toBe('GET');
    expect(fetchSpan.tags['http.status_code']).toBe('200.0');
    expect(fetchSpan.tags['http.url']).toBe(
      'https://raw.githubusercontent.com/signalfx/splunk-otel-react-native/main/package.json'
    );
  });
});
