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

import BidiMap from 'bidi-map';

const kContext = Symbol('context');
const kParent = Symbol('parent');

/**
 * A valid reference is any truthy value that is not boolean.
 *
 * @typedef {number|string|object|function|symbol} Reference
 */

/**
 * @example
 * import ReferenceContext from 'reference-context';
 *
 * const context = new ReferenceContext();
 */
export default class ReferenceContext {
  /**
   * Check if the given reference is valid.
   * All truthy values are valid reference expects `true`.
   *
   * @param {*} reference The given reference
   * @return {boolean} True if it's {Reference}
   */
  static isValidReference(reference) {
    switch (typeof reference) {
      case 'object':
        return reference !== null;

      case 'function':
      case 'symbol':
        return true;

      case 'string':
      case 'number':
        return !!reference;

      case 'boolean':
      case 'undefined':
      default:
        return false;
    }
  }

  /**
   * Create a reference-context instance.
   *
   * @param {object|ReferenceContext|Iterable} [context] Initialize context with values
   * @param {ReferenceContext|null} [parentContext] The parent context for this context
   */
  constructor(context = {}, parentContext = null) {
    if (parentContext != null) {
      if (!(parentContext instanceof ReferenceContext)) {
        throw new TypeError(
          `Expect parent context be instance of ReferenceContext: ${parentContext}`
        );
      }

      /**
       * @type {ReferenceContext|null}
       * @private
       */
      this[kParent] = parentContext;
    } else if (context instanceof ReferenceContext) {
      this[kParent] = context[kParent];
    } else {
      this[kParent] = null;
    }

    /**
     * @type {BidiMap}
     * @private
     */
    this[kContext] = new BidiMap();

    this.copyFrom(context);
  }

  /**
   * Get the parent context.
   *
   * @type {ReferenceContext|null}
   */
  get parent() {
    return this[kParent];
  }

  /**
   * The the number of keys in this context including it's parents.
   *
   * @type {number}
   */
  get size() {
    return this[kContext].size + (this[kParent] ? this[kParent].size : 0);
  }

  /**
   * The the number of keys in this context (excluding the parents).
   *
   * @type {number}
   */
  get ownSize() {
    return this[kContext].size;
  }

  /**
   * The the number of values in this context including it's parents.
   *
   * @type {number}
   */
  get count() {
    return this[kContext].count + (this[kParent] ? this[kParent].count : 0);
  }

  /**
   * The the number of values in this context (excluding the parents).
   *
   * @type {number}
   */
  get ownCount() {
    return this[kContext].count;
  }

  /**
   * Get the instance constructor name.
   *
   * @override
   * @return {string}
   */
  toString() {
    return this.constructor.name;
  }

  /**
   * Copy from other context it's references and values
   *
   * @param {ReferenceContext|Map|Array|object} context The context to copy from
   * @return {ReferenceContext}
   */
  copyFrom(context) {
    if (context instanceof ReferenceContext || context instanceof Map) {
      context.forEach((value, key) => this.set(key, value));
    } else if (Array.isArray(context)) {
      context.forEach(([key, value]) => this.set(key, value));
    } else {
      Object.keys(context).forEach(key => this.set(key, context[key]));
    }

    return this;
  }

  /**
   * Iterate over the context own values.
   *
   * @param {function} callback
   * @param {*} [thisArg]
   * @return {ReferenceContext}
   */
  forEach(callback, thisArg) {
    this[kContext].forEach(callback, thisArg);
    return this;
  }

  /**
   * Create a closure context for this context.
   *
   * @return {ReferenceContext} The closure context
   */
  closure() {
    return new this.constructor({}, this);
  }

  /**
   * Check if this context or it's parents has the given reference.
   *
   * @param {Reference} reference The given reference
   * @return {boolean} True if it's has
   */
  has(reference) {
    if (this[kContext].has(reference)) return true;
    if (!this[kParent]) return false;

    return this[kParent].has(reference);
  }

  /**
   * Check if this context only (and not the parents) has the given reference.
   *
   * @param {Reference} reference The given reference
   * @return {boolean} True if it's has
   */
  hasOwnReference(reference) {
    return this[kContext].has(reference);
  }

  /**
   * Get the reference value on this context or it's parents.
   *
   * @param {Reference} reference The reference of the value
   * @throws {ReferenceError} If the reference not exists.
   * @return {*|undefined} The reference value or undefined
   */
  get(reference) {
    if (this[kContext].has(reference)) {
      return this[kContext].get(reference);
    }

    if (this[kParent]) {
      return this[kParent].get(reference);
    }

    throw new ReferenceError(`Reference not exists: ${reference}`);
  }

  /**
   * Set a reference for the given value.
   *
   * @param {Reference} reference The value reference
   * @param {*} value The referable value
   * @return {ReferenceContext}
   */
  set(reference, value) {
    if (!this.constructor.isValidReference(reference)) {
      throw new TypeError(`The given reference is not valid: ${reference}`);
    }

    const oldValue = this[kContext].get(reference);
    this[kContext].set(reference, value);

    if (!this[kContext].exists(oldValue)) {
      this.release(oldValue);
    }

    return this;
  }

  /**
   * Check if this context or one of it's parents has the given value.
   *
   * @param {*} value The given value
   * @return {boolean} True if it's does.
   */
  exists(value) {
    if (this[kContext].exists(value)) return true;
    if (!this[kParent]) return false;

    return this[kParent].exists(value);
  }

  /**
   * Check if this context only (excluding the parents) has the given value.
   *
   * @param {*} value The given value
   * @return {boolean} True if it's does.
   */
  own(value) {
    return this[kContext].exists(value);
  }

  /**
   * Get the reference of the given value in this context or one of it's parents.
   * Return undefined if the value not exists.
   *
   * @param {*} value The given value
   * @throws {ReferenceError} If the value not exists.
   * @return {Reference|undefined} The value reference or undefined
   */
  lookup(value) {
    const reference = this[kContext].getKeyOf(value);
    if (reference !== undefined) return reference;

    if (this[kParent]) {
      return this[kParent].lookup(value);
    }

    throw new ReferenceError(`Value not exists: ${reference}`);
  }

  /**
   * Assign a new reference for the given value or return it's current reference.
   *
   * @param {*} value The given value
   * @throws {TypeError} If generating references is not supported in this context
   * @return {Reference} The generated reference
   */
  assign(value) {
    if (this.exists(value)) {
      return this.lookup(value);
    }

    let reference;
    do {
      reference = this.generateReference();
    } while (this.has(reference));

    this.set(reference, value);

    return reference;
  }

  /**
   * Generate a reference for the `assign` method.
   * The reference not required to be unique, the callee is responsible to verify that the
   * reference is not in use and if required call this method again.
   *
   * @throws {TypeError} If generating references is not supported in this context
   * @return {Reference} The generated reference
   */
  generateReference() {
    throw new TypeError(`Assign is not supported at ${this}`);
  }

  /**
   * Remove the given reference from this context.
   * If the reference exists only on the parent contexts, this method will do nothing.
   *
   * @param {Reference} reference The given reference
   * @return {boolean} True if the reference has been removed
   */
  delete(reference) {
    if (!this[kContext].has(reference)) return false;

    const value = this[kContext].get(reference);
    const references = this[kContext].getKeysOf(value);

    this[kContext].delete(reference);

    if (references.length === 1) {
      this.release(value);
    }

    return true;
  }

  /**
   * Release a value from this context and remove any reference for this value.
   * If the value exists on the parent context, this method will do nothing.
   *
   * @param {*} value The value to release
   * @return {boolean} True if the value released from this context
   */
  release(value) {
    const references = this[kContext].getKeysOf(value);
    if (!references.length) return false;

    references.forEach(reference => this.delete(reference));

    return true;
  }

  /**
   * Clear and release all the values on this context.
   *
   * @return {void}
   */
  clear() {
    this[kContext].clear();
  }
}

/**
 * @type {ReferenceContext.isValidReference}
 */
export const isValidReference = ReferenceContext.isValidReference;
