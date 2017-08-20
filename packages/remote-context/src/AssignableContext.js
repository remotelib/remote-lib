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

/**
 * @alias ReferenceContext
 */
import ReferenceContext from 'reference-context';

// Maximum number of references allowed on this context, which is about 65K references.
// That's already more the enough, but can be changed up to `Number.MAX_SAFE_INTEGER`.
const MAX_REFERENCES_DEFAULT = 256 ** 2;

const kRefNumMax = Symbol('refNumMax');
const kNextRefId = Symbol('nextRefId');

/**
 * A {@link ReferenceContext} with assignment support.
 *
 * @extends {ReferenceContext}
 */
export default class AssignableContext extends ReferenceContext {
  /**
   * @param {object} context The context
   * @param {ReferenceContext|null} parentContext The context parent
   * @param {object} opts Options
   * @param {number} [opts.maxReferences=65536] The maximum references allowed to assign on this
   * context
   */
  constructor(context, parentContext, opts = {}) {
    super({}, parentContext);

    if (parentContext instanceof AssignableContext) {
      /**
       * @type {number}
       * @private
       */
      this[kRefNumMax] = parentContext[kRefNumMax];

      /**
       * @type {number}
       * @private
       */
      this[kNextRefId] = parentContext[kNextRefId];
    } else {
      this[kRefNumMax] = opts.maxReferences || MAX_REFERENCES_DEFAULT;
      this[kNextRefId] = 1;
    }

    this.copyFrom(context);
  }

  /**
   * @override
   */
  generateReference() {
    // `this.size` is not the real generated reference number,
    // but if we got so many references it's better to stop now.
    if (this.size >= this[kRefNumMax]) {
      throw new Error(`Maximum references number reached: ${this[kRefNumMax]}`);
    }

    const refId = this[kNextRefId];

    if (this[kNextRefId] < Number.MAX_SAFE_INTEGER) {
      this[kNextRefId] += 1;
    } else {
      this[kNextRefId] = 1;
    }

    return refId;
  }
}
