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

import { MutableAttributes } from '../model/attributes/MutableAttributes';
import NativeModule from '../specs/NativeSplunkOtelReactNative';

const mockNative = NativeModule as jest.Mocked<typeof NativeModule>;

describe('MutableAttributes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes basic methods', () => {
    const attrs = new MutableAttributes();
    expect(typeof attrs.setString).toBe('function');
    expect(typeof attrs.getAll).toBe('function');
    expect(typeof attrs.update).toBe('function');
  });

  describe('update()', () => {
    it('calls setAll with mutator result', async () => {
      const attrs = new MutableAttributes();

      mockNative.globalAttributesGetAll.mockResolvedValueOnce({
        existingKey: 'existingValue',
      });

      await attrs.update((current) => ({
        ...current,
        newKey: 'newValue',
      }));

      expect(mockNative.globalAttributesSetAll).toHaveBeenCalledWith({
        existingKey: 'existingValue',
        newKey: 'newValue',
      });
    });

    it('removes keys that mutator deletes', async () => {
      const attrs = new MutableAttributes();

      mockNative.globalAttributesGetAll.mockResolvedValueOnce({
        keepMe: 'value1',
        deleteMe: 'value2',
        alsoDeleteMe: 'value3',
      });

      await attrs.update((current) => {
        const { deleteMe, alsoDeleteMe, ...rest } = current;
        void deleteMe;
        void alsoDeleteMe;
        return rest;
      });

      expect(mockNative.globalAttributesRemove).toHaveBeenCalledWith(
        'deleteMe'
      );
      expect(mockNative.globalAttributesRemove).toHaveBeenCalledWith(
        'alsoDeleteMe'
      );
      expect(mockNative.globalAttributesRemove).toHaveBeenCalledTimes(2);

      expect(mockNative.globalAttributesSetAll).toHaveBeenCalledWith({
        keepMe: 'value1',
      });
    });

    it('does not call remove when no keys are deleted', async () => {
      const attrs = new MutableAttributes();

      mockNative.globalAttributesGetAll.mockResolvedValueOnce({
        key1: 'value1',
      });

      await attrs.update((current) => ({
        ...current,
        key2: 'value2',
      }));

      expect(mockNative.globalAttributesRemove).not.toHaveBeenCalled();

      expect(mockNative.globalAttributesSetAll).toHaveBeenCalledWith({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('handles empty initial attributes', async () => {
      const attrs = new MutableAttributes();

      mockNative.globalAttributesGetAll.mockResolvedValueOnce({});

      await attrs.update(() => ({
        newKey: 'newValue',
      }));

      expect(mockNative.globalAttributesRemove).not.toHaveBeenCalled();
      expect(mockNative.globalAttributesSetAll).toHaveBeenCalledWith({
        newKey: 'newValue',
      });
    });

    it('handles mutator returning empty object (removes all)', async () => {
      const attrs = new MutableAttributes();

      mockNative.globalAttributesGetAll.mockResolvedValueOnce({
        key1: 'value1',
        key2: 'value2',
      });

      await attrs.update(() => ({}));

      expect(mockNative.globalAttributesRemove).toHaveBeenCalledWith('key1');
      expect(mockNative.globalAttributesRemove).toHaveBeenCalledWith('key2');
      expect(mockNative.globalAttributesRemove).toHaveBeenCalledTimes(2);

      expect(mockNative.globalAttributesSetAll).toHaveBeenCalledWith({});
    });
  });
});
