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

import ReferenceContext from 'reference-context';

const kName = Symbol('name');

/**
 * @extends {ReferenceContext}
 * @example
 * import { EnvContext } from 'remote-context';
 *
 * const envContext = new EnvContext(name, context);
 */
export default class EnvContext extends ReferenceContext {
  /**
   * Create a new environment context.
   *
   * @param {string} name The known name of the environment
   * @param {object} context A key-value object with all the context values.
   */
  constructor(name, context) {
    if (!name || typeof name !== 'string') {
      throw new TypeError(`Invalid "name" param: ${name}`);
    }
    if (!context || typeof context !== 'object') {
      throw new TypeError(
        `Environment "context" param should be an object: ${context}`,
      );
    }

    super(context);

    /**
     * @type {string}
     * @private
     */
    this[kName] = name;
  }

  /**
   * Get the known name of this environment
   *
   * @type {string}
   */
  get name() {
    return this[kName];
  }
}
