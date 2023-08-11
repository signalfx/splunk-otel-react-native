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

describe('Navigation', () => {
  before(() => {
    devServer = getDevServer({ port: 53820 });
  });

  beforeEach(() => {
    devServer.clearSpans();
  });

  it('should set correct screen names', async () => {
    const navigationButton = await driver.$('~goToDetailScreen');
    await navigationButton.waitForDisplayed({ timeout: 10000 });

    const createSpan = await devServer.findSpan(
      (span) => span.tags.component === 'ui'
    );
    console.log(createSpan);
    expect(createSpan).toBeDefined();
    // find first screen Create span
    // cliick on goToDetailScreen
    // find second screen Create span
  });
});
