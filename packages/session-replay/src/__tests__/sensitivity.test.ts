/*
 * Copyright 2026 Splunk Inc.
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

import Native from '../specs/NativeSplunkSessionReplay';
import { toSensitivity } from '../bridge/converters';
import { Sensitivity } from '../model/Sensitivity';
import { RenderingMode } from '../model/RenderingMode';
import { NativeViewClass } from '../model/NativeViewClass';
import { SplunkSessionReplay } from '../SessionReplay';

const native = Native as jest.Mocked<typeof Native>;

describe('sensitivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toSensitivity', () => {
    it('maps every native value', () => {
      expect(toSensitivity('sensitive')).toBe(Sensitivity.SENSITIVE);
      expect(toSensitivity('notSensitive')).toBe(Sensitivity.NOT_SENSITIVE);
      expect(toSensitivity('unset')).toBe(Sensitivity.UNSET);
    });

    it('falls back to unset for unknown values', () => {
      expect(toSensitivity('something-else')).toBe(Sensitivity.UNSET);
    });
  });

  describe('instance sensitivity', () => {
    it('forwards the tag and value', async () => {
      await SplunkSessionReplay.instance.setViewSensitivity(42, true);
      expect(native.setViewSensitivity).toHaveBeenCalledWith(42, true);
    });

    it('forwards clears', async () => {
      await SplunkSessionReplay.instance.clearViewSensitivity(42);
      expect(native.clearViewSensitivity).toHaveBeenCalledWith(42);
    });
  });

  describe('class sensitivity', () => {
    it('reads back a mapped enum value', async () => {
      native.getClassSensitivity.mockResolvedValueOnce('sensitive');

      await expect(
        SplunkSessionReplay.instance.getClassSensitivity('SomeClass')
      ).resolves.toBe(Sensitivity.SENSITIVE);
    });

    it('applies maskAllText to every class name for the platform', async () => {
      await SplunkSessionReplay.instance.maskAllText();

      for (const name of NativeViewClass.TEXT) {
        expect(native.setClassSensitivity).toHaveBeenCalledWith(name, true);
      }
    });

    it('supports unmasking through the same helper', async () => {
      await SplunkSessionReplay.instance.maskAllImages(false);

      for (const name of NativeViewClass.IMAGE) {
        expect(native.setClassSensitivity).toHaveBeenCalledWith(name, false);
      }
    });

    // A class set spans both React Native architectures, so the names for the
    // one not in use are expected to be unresolvable.
    it('succeeds when only some class names resolve', async () => {
      native.setClassSensitivity
        .mockRejectedValueOnce(new Error('E_SESSION_REPLAY_UNKNOWN_CLASS'))
        .mockResolvedValueOnce(undefined);

      await expect(
        SplunkSessionReplay.instance.setClassSensitivity(
          ['MissingClass', 'PresentClass'],
          true
        )
      ).resolves.toBeUndefined();
    });

    it('rejects only when no class name resolves', async () => {
      native.setClassSensitivity.mockRejectedValue(
        new Error('E_SESSION_REPLAY_UNKNOWN_CLASS')
      );

      await expect(
        SplunkSessionReplay.instance.setClassSensitivity(
          ['MissingA', 'MissingB'],
          true
        )
      ).rejects.toThrow('E_SESSION_REPLAY_UNKNOWN_CLASS');
    });

    it('skips unresolvable names when reading back', async () => {
      native.getClassSensitivity
        .mockRejectedValueOnce(new Error('E_SESSION_REPLAY_UNKNOWN_CLASS'))
        .mockResolvedValueOnce('sensitive');

      await expect(
        SplunkSessionReplay.instance.getClassSensitivity([
          'MissingClass',
          'PresentClass',
        ])
      ).resolves.toBe(Sensitivity.SENSITIVE);
    });
  });
});

describe('renderingMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the wire value, not the enum name', async () => {
    await SplunkSessionReplay.instance.setRenderingMode(
      RenderingMode.WIREFRAME_ONLY
    );
    expect(native.setRenderingMode).toHaveBeenCalledWith('wireframeOnly');
  });

  it('surfaces the effective mode through getState', async () => {
    native.getState.mockResolvedValueOnce({
      status: 'recording',
      isRecording: true,
      samplingRate: 1,
      renderingMode: 'wireframeOnly',
    });

    const state = await SplunkSessionReplay.instance.getState();
    expect(state.renderingMode).toBe(RenderingMode.WIREFRAME_ONLY);
  });
});
