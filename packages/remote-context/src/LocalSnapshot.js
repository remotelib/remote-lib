/**
 * Copyright 2017 Moshe Simantov
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
  equalValue,
  equalDescriptors,
  getOwnPropertyDescriptors,
  cacheGetters,
} from './helpers/descriptors';

const kValue = Symbol('value');
const kPrototype = Symbol('prototype');
const kDescriptors = Symbol('descriptors');
const kCachedGetters = Symbol('cachedGetters');

export default class LocalSnapshot {
  /**
   * Create a snapshot from the given value.
   *
   * @param {*} value The given value
   */
  constructor(value) {
    /**
     * @type {*}
     * @private
     */
    this[kValue] = value;

    if (value instanceof Object) {
      /**
       * @type {object}
       * @private
       */
      this[kCachedGetters] = cacheGetters(value);

      /**
       * @type {Object}
       * @private
       */
      this[kPrototype] = Object.getPrototypeOf(value);

      /**
       * @type {object}
       * @private
       */
      this[kDescriptors] = getOwnPropertyDescriptors(value);
    }
  }

  /**
   * Get the original value.
   *
   * @type {*}
   */
  get value() {
    return this[kValue];
  }

  /**
   * Get the value prototype snapshot.
   *
   * @type {object|undefined}
   */
  get prototype() {
    return this[kPrototype];
  }

  /**
   * Get the value properties descriptors snapshot.
   *
   * @type {object|undefined}
   */
  get ownPropertyDescriptors() {
    return this[kDescriptors];
  }

  /**
   * Get the value properties descriptors snapshot.
   *
   * @type {object|undefined}
   */
  get cachedGetters() {
    return this[kCachedGetters];
  }

  /**
   * Update the local reference of this value with a new version of this snapshot value.
   *
   * @param {LocalReference} localReference The local reference of this snapshot value
   * @return {void}
   */
  update(localReference) {
    if (this[kDescriptors] === undefined) return;

    const value = this[kValue];

    const cachedGetters = cacheGetters(value);
    const prototype = Object.getPrototypeOf(value);
    const descriptors = getOwnPropertyDescriptors(value);

    // Update snapshot immediately before any other actions
    const oldPrototype = this[kPrototype];
    this[kPrototype] = prototype;
    const oldDescriptors = this[kDescriptors];
    this[kDescriptors] = descriptors;
    const oldCachedGetters = this[kCachedGetters];
    this[kCachedGetters] = cachedGetters;

    // Update prototype
    if (oldPrototype !== prototype) {
      localReference.setPrototypeOf(prototype);
    }

    // Remove deleted properties
    Object.keys(oldDescriptors).forEach(property => {
      const newDesc = descriptors[property];
      if (newDesc !== undefined) return;

      localReference.deleteProperty(property);

      if (cachedGetters !== undefined) {
        // There is no need to delete cache for deleted property.
        // Skip localReference#deletePropertyCache() later on.
        delete oldCachedGetters[property];
      }
    });

    // Add or update existed properties
    Object.keys(descriptors).forEach(property => {
      const newDesc = descriptors[property];
      const oldDesc = oldDescriptors[property];

      if (!equalDescriptors(newDesc, oldDesc)) {
        localReference.defineProperty(property, newDesc);
      }
    });

    // Remove deleted getters cache
    Object.keys(oldCachedGetters).forEach(property => {
      if (property in cachedGetters) return;

      localReference.deletePropertyCache(property);
    });

    // Set new cached getters
    Object.keys(cachedGetters).forEach(property => {
      const newValue = cachedGetters[property];
      const oldValue = oldCachedGetters[property];

      if (!equalValue(newValue, oldValue)) {
        localReference.setPropertyCache(property, newValue);
      }
    });
  }
}
