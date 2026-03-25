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

import { AgentPreferences } from '../api/AgentPreferences';

const mockGetEndpointConfiguration = jest.fn().mockResolvedValue(null);
const mockSetEndpointConfiguration = jest.fn().mockResolvedValue(undefined);

jest.mock('../sdk/SplunkNativeBridge', () => ({
  SplunkNativeBridge: {
    getEndpointConfiguration: (...args: unknown[]) =>
      mockGetEndpointConfiguration(...args),
    setEndpointConfiguration: (...args: unknown[]) =>
      mockSetEndpointConfiguration(...args),
  },
}));

describe('AgentPreferences', () => {
  let preferences: AgentPreferences;

  beforeEach(() => {
    preferences = new AgentPreferences();

    mockGetEndpointConfiguration.mockClear();
    mockSetEndpointConfiguration.mockClear();
  });

  describe('getEndpointConfiguration', () => {
    it('returns undefined when native returns null', async () => {
      mockGetEndpointConfiguration.mockResolvedValue(null);

      const result = await preferences.getEndpointConfiguration();

      expect(result).toBeUndefined();
      expect(mockGetEndpointConfiguration).toHaveBeenCalled();
    });

    it('converts realm endpoint from native', async () => {
      mockGetEndpointConfiguration.mockResolvedValue({
        realm: 'us0',
        rumAccessToken: 'tok',
      });

      const result = await preferences.getEndpointConfiguration();

      expect(result).toEqual({ realm: 'us0', rumAccessToken: 'tok' });
    });

    it('converts trace endpoint from native', async () => {
      mockGetEndpointConfiguration.mockResolvedValue({
        trace: 'https://t.example.com',
        sessionReplay: 'https://sr.example.com',
      });

      const result = await preferences.getEndpointConfiguration();

      expect(result).toEqual({
        trace: 'https://t.example.com',
        sessionReplay: 'https://sr.example.com',
      });
    });

    it('converts trace-only endpoint from native', async () => {
      mockGetEndpointConfiguration.mockResolvedValue({
        trace: 'https://t.example.com',
      });

      const result = await preferences.getEndpointConfiguration();

      expect(result).toEqual({ trace: 'https://t.example.com' });
    });
  });

  describe('setEndpointConfiguration', () => {
    it('calls native bridge with realm endpoint', async () => {
      await preferences.setEndpointConfiguration({
        realm: 'us0',
        rumAccessToken: 'my-token',
      });

      expect(mockSetEndpointConfiguration).toHaveBeenCalledWith({
        realm: 'us0',
        rumAccessToken: 'my-token',
      });
    });

    it('calls native bridge with custom trace endpoint', async () => {
      await preferences.setEndpointConfiguration({
        trace: 'https://traces.example.com',
        sessionReplay: 'https://logs.example.com',
      });

      expect(mockSetEndpointConfiguration).toHaveBeenCalledWith({
        trace: 'https://traces.example.com',
        sessionReplay: 'https://logs.example.com',
      });
    });

    it('calls native bridge with trace-only endpoint', async () => {
      await preferences.setEndpointConfiguration({
        trace: 'https://traces.example.com',
      });

      expect(mockSetEndpointConfiguration).toHaveBeenCalledWith({
        trace: 'https://traces.example.com',
      });
    });

    it('calls native bridge with null to clear endpoint', async () => {
      await preferences.setEndpointConfiguration(null);

      expect(mockSetEndpointConfiguration).toHaveBeenCalledWith(null);
    });
  });
});
