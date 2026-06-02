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

import {
  sanitizeHeaderNames,
  sanitizeAndJoinHeaders,
} from '../model/modules/headers/sanitizeHeaderNames';

describe('sanitizeHeaderNames', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('passes through valid header names unchanged', () => {
    expect(
      sanitizeHeaderNames(['Content-Type', 'Accept', 'X-Request-ID'], 'test', false)
    ).toEqual(['Content-Type', 'Accept', 'X-Request-ID']);
  });

  it('trims whitespace from names', () => {
    expect(
      sanitizeHeaderNames(['  Content-Type  ', ' Accept'], 'test', false)
    ).toEqual(['Content-Type', 'Accept']);
  });

  it('drops empty and whitespace-only entries', () => {
    expect(
      sanitizeHeaderNames(['', '  ', 'Accept', ''], 'test', false)
    ).toEqual(['Accept']);
  });

  it('drops names with invalid RFC 7230 characters (spaces)', () => {
    expect(
      sanitizeHeaderNames(['My Header', 'Accept'], 'test', false)
    ).toEqual(['Accept']);
  });

  it('drops names with colons (full header lines)', () => {
    expect(
      sanitizeHeaderNames(['Authorization: Bearer token', 'Accept'], 'test', false)
    ).toEqual(['Accept']);
  });

  it('drops names with control characters', () => {
    expect(
      sanitizeHeaderNames(['Bad\x00Name', 'Accept'], 'test', false)
    ).toEqual(['Accept']);
  });

  it('de-duplicates case-insensitively, preserving first casing', () => {
    expect(
      sanitizeHeaderNames(
        ['Content-Type', 'content-type', 'CONTENT-TYPE'],
        'test',
        false
      )
    ).toEqual(['Content-Type']);
  });

  it('handles all RFC 7230 tchar characters', () => {
    const tcharName = "!#$%&'*+-.^_`|~AZaz09";
    expect(
      sanitizeHeaderNames([tcharName], 'test', false)
    ).toEqual([tcharName]);
  });

  it('returns empty array for empty input', () => {
    expect(sanitizeHeaderNames([], 'test', false)).toEqual([]);
  });

  it('returns empty array when all entries are invalid', () => {
    expect(
      sanitizeHeaderNames(['', 'bad name', 'also:bad'], 'test', false)
    ).toEqual([]);
  });

  describe('debug logging', () => {
    it('logs warning for empty entries when debug enabled', () => {
      sanitizeHeaderNames(['', 'Accept'], 'testField', true);

      expect(warnSpy).toHaveBeenCalledWith(
        'SplunkRum: ignoring empty HTTP header name at index 0 in testField.'
      );
    });

    it('logs warning for invalid entries without echoing the value', () => {
      sanitizeHeaderNames(['Authorization: Bearer secret'], 'testField', true);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]![0] as string;
      expect(message).toContain('ignoring invalid HTTP header name');
      expect(message).toContain('index 0');
      expect(message).toContain('RFC 7230');
      expect(message).not.toContain('Bearer');
      expect(message).not.toContain('secret');
    });

    it('logs warning for duplicates when debug enabled', () => {
      sanitizeHeaderNames(
        ['Accept', 'accept'],
        'testField',
        true
      );

      expect(warnSpy).toHaveBeenCalledWith(
        'SplunkRum: ignoring duplicate HTTP header name at index 1 ' +
          'in testField (case-insensitive match).'
      );
    });

    it('does not log when debug disabled', () => {
      sanitizeHeaderNames(
        ['', 'bad name', 'Accept', 'accept'],
        'test',
        false
      );

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});

describe('sanitizeAndJoinHeaders', () => {
  it('joins sanitized names with comma-space', () => {
    expect(
      sanitizeAndJoinHeaders(['Content-Type', 'Accept'], 'test', false)
    ).toBe('Content-Type, Accept');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeAndJoinHeaders([], 'test', false)).toBe('');
  });

  it('returns empty string when all entries are invalid', () => {
    expect(
      sanitizeAndJoinHeaders(['', 'bad name'], 'test', false)
    ).toBe('');
  });

  it('sanitizes before joining', () => {
    expect(
      sanitizeAndJoinHeaders(
        ['  Content-Type  ', '', 'content-type', 'Accept'],
        'test',
        false
      )
    ).toBe('Content-Type, Accept');
  });
});
