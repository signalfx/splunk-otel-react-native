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

import type { Attributes, AttributeValue } from '@opentelemetry/api';
import type { AttributeArray } from '../../bridge/nativeModulesTypes';
import { SplunkNativeBridge as Native } from '../../sdk/SplunkNativeBridge';

/**
 * Thread-safe mutable collection of attributes.
 *
 * Attributes set via this API are sent with all telemetry signals (spans, events).
 *
 * Access via `SplunkRum.instance.globalAttributes`.
 *
 * @example Typed access
 * ```typescript
 * const attrs = SplunkRum.instance.globalAttributes;
 *
 * await attrs.setString('user.name', 'Alice');
 * await attrs.setNumber('user.loginCount', 5);
 * await attrs.setBoolean('user.isPremium', true);
 *
 * const name = await attrs.getString('user.name');
 * ```
 *
 * @example Bulk operations
 * ```typescript
 * await attrs.setAll({
 *   'app.version': '2.0.0',
 *   'app.build': 1234,
 * });
 *
 * await attrs.setAllInNamespace('user', {
 *   name: 'Alice',
 *   tier: 'premium',
 * });
 * // Sets 'user.name' and 'user.tier'
 * ```
 */
export class MutableAttributes {
  /**
   * Sets an attribute value (auto-detects type).
   *
   * @param key - Attribute key.
   * @param value - Value or `null` to remove.
   */
  async setValue(key: string, value: AttributeValue | null): Promise<void> {
    if (value === null) {
      await this.remove(key);
      return;
    }

    if (Array.isArray(value)) {
      return Native.globalAttributesSetArray(key, value as AttributeArray);
    }

    switch (typeof value) {
      case 'string':
        return Native.globalAttributesSetString(key, value);
      case 'boolean':
        return Native.globalAttributesSetBoolean(key, value);
      case 'number':
        return Native.globalAttributesSetNumber(key, value);
      default:
        await this.remove(key);
    }
  }

  /**
   * Sets a string attribute.
   *
   * @param key - Attribute key.
   * @param value - String value or `null` to remove.
   */
  async setString(key: string, value: string | null): Promise<void> {
    if (value === null) {
      await this.remove(key);
      return;
    }

    return Native.globalAttributesSetString(key, value);
  }

  /**
   * Sets a boolean attribute.
   *
   * @param key - Attribute key.
   * @param value - Boolean value or `null` to remove.
   */
  async setBoolean(key: string, value: boolean | null): Promise<void> {
    if (value === null) {
      await this.remove(key);
      return;
    }

    return Native.globalAttributesSetBoolean(key, value);
  }

  /**
   * Sets a numeric attribute.
   *
   * @param key - Attribute key.
   * @param value - Number value or `null` to remove.
   */
  async setNumber(key: string, value: number | null): Promise<void> {
    if (value === null) {
      await this.remove(key);
      return;
    }

    return Native.globalAttributesSetNumber(key, value);
  }

  /**
   * Sets an array attribute.
   *
   * @param key - Attribute key.
   * @param value - Array of primitives or `null` to remove.
   */
  async setArray(
    key: string,
    value: Array<string | number | boolean> | null
  ): Promise<void> {
    if (value === null) {
      await this.remove(key);
      return;
    }

    return Native.globalAttributesSetArray(key, value as AttributeArray);
  }

  /**
   * Gets an attribute value (any type).
   *
   * @param key - Attribute key.
   * @returns Value or `undefined` if not set.
   */
  async getValue(key: string): Promise<AttributeValue | undefined> {
    const v = await Native.globalAttributesGetValue(key);
    return v === null || v === undefined ? undefined : (v as AttributeValue);
  }

  /**
   * Gets a string attribute.
   *
   * @param key - Attribute key.
   * @returns String value or `undefined`.
   */
  async getString(key: string): Promise<string | undefined> {
    const v = await Native.globalAttributesGetString(key);
    return v === null ? undefined : v;
  }

  /**
   * Gets a boolean attribute.
   *
   * @param key - Attribute key.
   * @returns Boolean value or `undefined`.
   */
  async getBoolean(key: string): Promise<boolean | undefined> {
    const v = await Native.globalAttributesGetBoolean(key);
    return v === null ? undefined : v;
  }

  /**
   * Gets a numeric attribute.
   *
   * @param key - Attribute key.
   * @returns Number value or `undefined`.
   */
  async getNumber(key: string): Promise<number | undefined> {
    const v = await Native.globalAttributesGetNumber(key);
    return v === null ? undefined : v;
  }

  /**
   * Gets an array attribute.
   *
   * @param key - Attribute key.
   * @returns Array value or `undefined`.
   */
  async getArray(
    key: string
  ): Promise<Array<string | number | boolean> | undefined> {
    const v = await Native.globalAttributesGetArray(key);
    return v === null ? undefined : v;
  }

  /**
   * Sets multiple attributes.
   *
   * @param attributes - Key-value pairs to set.
   * @returns Number of attributes set.
   */
  async setAll(attributes: Attributes): Promise<number> {
    return Native.globalAttributesSetAll(attributes);
  }

  /**
   * Sets multiple attributes with a namespace prefix.
   *
   * Keys are prefixed with `{namespace}.`.
   *
   * @param namespace - Prefix for all keys.
   * @param attributes - Key-value pairs to set.
   * @returns Number of attributes set.
   */
  async setAllInNamespace(
    namespace: string,
    attributes: Attributes
  ): Promise<number> {
    return Native.globalAttributesSetAllInNameSpace(namespace, attributes);
  }

  /**
   * Removes an attribute.
   *
   * @param key - Attribute key.
   * @returns Previous value or `undefined`.
   */
  async remove(key: string): Promise<AttributeValue | undefined> {
    const v = await Native.globalAttributesRemove(key);
    return v === null || v === undefined ? undefined : (v as AttributeValue);
  }

  /**
   * Removes all attributes.
   */
  async removeAll(): Promise<void> {
    return Native.globalAttributesRemoveAll();
  }

  /**
   * Checks if an attribute exists.
   *
   * @param key - Attribute key.
   * @returns `true` if attribute is set.
   */
  async contains(key: string): Promise<boolean> {
    return Native.globalAttributesContains(key);
  }

  /**
   * Gets all attributes.
   *
   * @returns All key-value pairs.
   */
  async getAll(): Promise<Attributes> {
    const nativeAttrs = await Native.globalAttributesGetAll();
    return nativeAttrs as Attributes;
  }

  /**
   * Gets all attribute keys.
   *
   * @returns Array of keys.
   */
  async keys(): Promise<string[]> {
    return Native.globalAttributesKeys();
  }

  /**
   * Gets all attribute values.
   *
   * @returns Array of values.
   */
  async values(): Promise<AttributeValue[]> {
    const nativeValues = await Native.globalAttributesValues();
    return nativeValues as AttributeValue[];
  }

  /**
   * Gets attribute count.
   *
   * @returns Number of attributes.
   */
  async size(): Promise<number> {
    return Native.globalAttributesSize();
  }

  /**
   * Updates attributes using a mutator function.
   *
   * Fetches current attributes, applies the mutator, and replaces all
   * attributes with the result. Keys present in current but missing from
   * the mutator's return value will be removed.
   *
   * @param mutator - Function that receives current attributes and returns updated ones.
   *
   * @example Remove an attribute
   * ```typescript
   * await attrs.update((current) => {
   *   const { keyToRemove, ...rest } = current;
   *   return rest;
   * });
   * ```
   */
  async update(mutator: (current: Attributes) => Attributes): Promise<void> {
    const current = await this.getAll();
    const updated = mutator(current);

    // Find keys that were removed by the mutator
    const currentKeys = Object.keys(current);
    const updatedKeys = new Set(Object.keys(updated));
    const removedKeys = currentKeys.filter((key) => !updatedKeys.has(key));

    // Remove keys that are no longer present
    await Promise.all(removedKeys.map((key) => this.remove(key)));

    // Set the updated attributes
    await this.setAll(updated);
  }
}
