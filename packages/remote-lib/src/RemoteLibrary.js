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

import Library from './Library';

const kRemoteContext = Symbol('remoteContext');

/**
 * A remote library connected with duplex stream to a local {@link Library}.
 *
 * @example
 * import { RemoteLibrary } from 'remote-lib';
 *
 * const remoteLibrary = new RemoteLibrary(stream);
 */
export default class RemoteLibrary {
  /**
   * Create a remote library with a duplex stream to a local {@link Library}.
   *
   * @param {Duplex} stream A duplex stream to the local library
   * @param {object} [opts] Options to {@link Context} and {@link RemoteSession}
   * @return {RemoteLibrary}
   */
  constructor(stream, opts = {}) {
    const library = new Library({}, opts);

    /**
     * @type {RemoteContext}
     * @private
     */
    this[kRemoteContext] = library.remote(stream, opts);

    return new Proxy(this, {
      get(target, property) {
        if (property in target) {
          return target[property];
        }

        return new Proxy(target.get(property), {
          apply(func, thisArg, argumentsList) {
            return func(...argumentsList);
          },
        });
      },
    });
  }

  /**
   * Get the library remote context.
   *
   * @return {RemoteContext}
   */
  get context() {
    return this[kRemoteContext];
  }

  /**
   * Bind a listener to the {@link RemoteContext}.
   *
   * @see {@link RemoteContext#on}
   * @param {string} eventName
   * @param {function} listener
   * @return {RemoteLibrary}
   */
  on(eventName, listener) {
    this[kRemoteContext].on(eventName, listener);
    return this;
  }

  /**
   * Bind a listener once to the {@link RemoteContext}.
   *
   * @see {@link RemoteContext#once}
   * @param {string} eventName
   * @param {function} listener
   * @return {RemoteLibrary}
   */
  once(eventName, listener) {
    this[kRemoteContext].once(eventName, listener);
    return this;
  }

  /**
   * Remove a listener from the {@link RemoteContext}.
   *
   * @see {@link RemoteContext#removeListener}
   * @param {string} eventName
   * @param {function} listener
   * @return {RemoteLibrary}
   */
  removeListener(eventName, listener) {
    this[kRemoteContext].removeListener(eventName, listener);
    return this;
  }

  /**
   * Fetch a reference value from {@link RemoteContext}.
   *
   * @see {@link RemoteContext#fetch}
   * @param {Reference} reference
   * @return {RemotePromise}
   */
  get(reference) {
    return this[kRemoteContext].fetch(reference);
  }

  /**
   * Delete a reference from {@link RemoteContext}.
   *
   * @see {@link RemoteContext#delete}
   * @param {Reference} reference
   * @return {boolean}
   */
  delete(reference) {
    return this[kRemoteContext].delete(reference);
  }

  /**
   * Release a value from {@link RemoteContext}.
   *
   * @see {@link RemoteContext#release}
   * @param {RemoteValueProxy} value
   * @return {boolean}
   */
  release(value) {
    return this[kRemoteContext].release(value);
  }

  /**
   * Resolve a value with {@link RemoteContext}.
   *
   * @see {@link RemoteContext#resolve}
   * @param {*} value
   * @return {RemotePromise}
   */
  resolve(value) {
    return this[kRemoteContext].resolve(value);
  }

  /**
   * Destroy {@link RemoteContext}.
   *
   * @see {@link RemoteContext#destroy}
   * @return {void}
   */
  destroy() {
    return this[kRemoteContext].destroy();
  }
}
