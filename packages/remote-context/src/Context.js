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

import AssignableContext from './AssignableContext';
import EnvContext from './EnvContext';
import RemoteSession from './RemoteSession';
import parser from './parser';
import LocalPromise from './LocalPromise';

const kChildRefs = Symbol('childRefs');

function getPropValueSafe(obj, prop) {
  try {
    return obj[prop];
  } catch (err) {
    return undefined;
  }
}

/**
 * @example
 * import { Context } from 'remote-context';
 *
 * const context = new Context(envContext);
 */
export default class Context extends AssignableContext {
  /**
   * Check if the given value is unique per this environment.
   * For example the string `'foo'` is not referable, but the object `{ foo: 1 }` is referable.
   *
   * @param {*} value The given value to check
   * @return {boolean} True if the given value is referable
   */
  static isReferable(value) {
    switch (typeof value) {
      case 'function':
      case 'symbol':
        return true;

      case 'object':
        return value !== null;

      default:
        return false;
    }
  }

  /**
   * Create a new virtual context on the given environment.
   *
   * @param {EnvContext} envContext The given environment
   * @param {object} context The context to create
   * @param {object} opts Options for {@link AssignableContext.constructor}
   */
  constructor(envContext, context = {}, opts = {}) {
    if (!(envContext instanceof EnvContext)) {
      throw new TypeError(`Invalid "envContext" param: ${envContext}`);
    }

    super({}, envContext, opts);

    /**
     * @type {Map}
     * @private
     */
    this[kChildRefs] = new Map();

    this.copyFrom(context);
  }

  /**
   * Get the remote context of this context.
   * A single context can be served to multiple peers, each peer will get a separate copy of the
   * context.
   *
   * @param {Stream} stream a duplex stream to the remote peer context
   * @param {object} [opts] Options to {@link RemoteSession}
   * @return {RemoteContext}
   */
  remote(stream, opts = {}) {
    const objectStream =
      opts.objectMode !== true ? parser.transform(stream) : stream;

    const session = new RemoteSession(objectStream, this, opts);
    return session.remote;
  }

  /**
   * Fetch a local reference and return a local promise.
   *
   * @param {Reference} reference The local reference to fetch
   * @return {LocalPromise}
   */
  fetch(reference) {
    try {
      return new LocalPromise(this.get(reference));
    } catch (error) {
      return new LocalPromise(error, true);
    }
  }

  /**
   * Resolve a local value and return a local promise to that value.
   *
   * @param {*} value The local value to resolve
   * @return {LocalPromise}
   */
  // eslint-disable-next-line class-methods-use-this
  resolve(value) {
    return new LocalPromise(value);
  }

  /**
   * @override
   */
  set(reference, value) {
    if (typeof reference !== 'string' && typeof reference !== 'number') {
      throw new TypeError(
        `Only string or number references are allowed: ${typeof reference}`
      );
    }

    super.set(reference, value);

    let childRefs = this[kChildRefs].get(value);
    if (!childRefs) {
      childRefs = new Set();
      this[kChildRefs].set(value, childRefs);
    }

    const proto = Object.getPrototypeOf(value);
    if (proto !== null && !this.exists(proto)) {
      const childRef = this.assign(proto);
      childRefs.add(childRef);
    }

    Object.getOwnPropertyNames(value).forEach(propName => {
      const propValue = getPropValueSafe(value, propName);
      if (!this.constructor.isReferable(propValue) || this.exists(propValue))
        return;

      const childRef = this.assign(propValue);
      childRefs.add(childRef);
    });

    Object.getOwnPropertySymbols(value).forEach(symbol => {
      const propValue = getPropValueSafe(value, symbol);
      if (
        !this.constructor.isReferable(propValue) ||
        this.exists(propValue) ||
        !this.exists(symbol)
      )
        return;

      const symbolReference = this.lookup(symbol);
      if (!symbolReference) return;

      const childRef = this.assign(propValue);
      childRefs.add(childRef);
    });

    return this;
  }

  /**
   * @override
   */
  release(value) {
    const ret = super.release(value);

    const childRefs = this[kChildRefs].get(value);
    if (childRefs) {
      childRefs.forEach(ref => this.delete(ref));
      this[kChildRefs].delete(value);
    }

    return ret;
  }

  /**
   * @override
   */
  clear() {
    super.clear();
    this[kChildRefs].clear();
  }
}
