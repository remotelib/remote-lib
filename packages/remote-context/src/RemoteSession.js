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

import { Session, Action } from 'remote-protocol';
import Context from './Context';
import LocalContext from './LocalContext';
import RemoteContext from './RemoteContext';
import { UndefinedValueAction } from './actions';
import RemoteReferenceAction from './actions/RemoteReferenceAction';
import LocalReferenceAction from './actions/LocalReferenceAction';

const kLocal = Symbol('local');
const kRemote = Symbol('remote');
const kBinds = Symbol('binds');
const kIsWritable = Symbol('isWritable');
const kShowStack = Symbol('showStack');

/**
 * A remote context {@link Session} to another peer.
 *
 * @extends {Session}
 * @example
 * import { RemoteSession } from 'remote-context';
 *
 * const session = new RemoteSession(objectStream, context);
 */
export default class RemoteSession extends Session {
  /**
   * Create a session from an object stream.
   *
   * @param {Stream} objectStream an actions object stream
   * @param {Context} context The main context
   * @param {options} [opts] {@link Session} options with extensions
   * @param {boolean} [opts.writable=false] True if this context is writable to the remote peer
   * @param {boolean} [opts.showStack=false] True if errors on this context should include full
   * stack (The stack will be send to the remote peer as a string)
   */
  constructor(objectStream, context, opts = {}) {
    if (!(context instanceof Context)) {
      throw new TypeError(`Invalid context: ${context}`);
    }

    super(objectStream, opts);

    /**
     * @type {LocalContext}
     * @private
     */
    this[kLocal] = new LocalContext(this, context);

    /**
     * @type {RemoteContext}
     * @private
     */
    this[kRemote] = new RemoteContext(this, context.parent);

    /**
     * @type {Map}
     * @private
     */
    this[kBinds] = new Map();

    /**
     * @type {boolean}
     * @private
     */
    this[kIsWritable] = opts.writable === true;

    /**
     * @type {boolean}
     * @private
     */
    this[kShowStack] = opts.showStack === true;
  }

  // Session methods

  /**
   * Get the remote context
   *
   * @type {RemoteContext}
   */
  get remote() {
    if (!this[kRemote]) {
      throw new Error(`${this} already destroyed`);
    }

    return this[kRemote];
  }

  /**
   * True if the remote peer should see stack errors.
   *
   * @type {boolean}
   */
  get showStack() {
    return this[kShowStack];
  }

  /**
   * Check if the given value is writable.
   * A value is writable if the local-context own it (ie. the value created elusively for this
   * peer) or if the context is writable and the main-context own it. Environment values are
   * always readonly unless there are on the context.
   *
   * @param {*} value The given value
   * @return {boolean}
   */
  isWritable(value) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    return (
      this[kLocal].own(value) ||
      (this[kIsWritable] && this[kLocal].parent.own(value))
    );
  }

  /**
   * Assign a remote or local reference to the given value and return the matching {@link Action}.
   * First check if the given value exists on the remote context and if so, return it's reference.
   * Otherwise assign a new reference for the given value on the local context.
   *
   * @param {*} value
   * @return {ReferenceAction}
   */
  assign(value) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    if (this[kRemote].exists(value)) {
      return new RemoteReferenceAction(this[kRemote].lookup(value));
    }

    return new LocalReferenceAction(this[kLocal].assign(value));
  }

  /**
   * Dispatch a value for the remote peer session.
   * Objects and functions will convert to actions, other primitive values such as string or numbers
   * will remain as-is.
   *
   * @override
   * @param {*} value
   * @return {Action|null|number|boolean|string}
   */
  dispatch(value) {
    switch (typeof value) {
      case 'symbol':
      case 'function': {
        // break and convert to reference
        break;
      }

      case 'object': {
        if (value === null) return null;

        if (
          value === this ||
          value === this[kLocal] ||
          value === this[kLocal].parent ||
          value === this[kRemote]
        ) {
          throw new ReferenceError(
            "[Safety Check] Can't dispatch internal context instances"
          );
        }

        if (value instanceof Action) {
          throw new TypeError(
            "Bad behaviour, shouldn't dispatch Action instances"
          );
        }

        // break and convert to reference
        break;
      }

      case 'undefined':
      default: {
        // `undefined` is not a valid JSON/MsgPack value
        return new UndefinedValueAction();
      }

      case 'number':
      case 'string':
      case 'boolean': {
        return value;
      }
    }

    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    if (this[kRemote].exists(value)) {
      return this[kRemote].dispatch(value);
    }

    return this[kLocal].dispatch(value);
  }

  /**
   * Bind to a local function and apply it remotely if the `this` parameter is a remote value.
   *
   * @param {function} func The local function to bind
   * @return {function} A proxy to the original local function
   */
  bind(func) {
    if (typeof func !== 'function') {
      throw new TypeError(`Can't bind to non-function value: ${typeof func}`);
    }

    if (!this.exists(func)) {
      return func;
    }

    let proxy = this[kBinds].get(func);
    if (!proxy) {
      const self = this;

      proxy = new Proxy(func, {
        apply(target, thisArg, argumentsList) {
          if (self.exists(thisArg)) {
            return target.apply(thisArg, argumentsList);
          }

          const remote = self.remote;
          const reference = remote.lookup(target);
          return remote.fetch(reference).apply(thisArg, argumentsList);
        },

        // No need to bind construct
      });

      this[kBinds].set(func, proxy);
    }

    return proxy;
  }

  /**
   * @override
   */
  destroy(err) {
    super.destroy(err);
    if (!this[kLocal]) return;

    this[kLocal].clear();
    this[kRemote].clear();
    this[kBinds].clear();

    delete this[kLocal];
    delete this[kRemote];
    delete this[kBinds];
  }

  // Context methods

  /**
   * Get a local reference value from the local-context.
   *
   * @param {Reference} reference The local reference
   * @return {*}
   */
  get(reference) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    return this[kLocal].get(reference);
  }

  /**
   * Set a local reference to the local-context.
   *
   * @param {Reference} reference The local reference
   * @param {*} value The local value
   * @return {RemoteSession}
   */
  set(reference, value) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    this[kLocal].set(reference, value);
    return this;
  }

  /**
   * Check if the given value exists on the local-context.
   *
   * @param {*} value The given value
   * @return {boolean} True if exists
   */
  exists(value) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    return this[kLocal].exists(value);
  }

  /**
   * Delete a local reference from the local-context.
   *
   * @param {Reference} reference The local reference
   * @return {boolean} True if the reference has been removed
   */
  delete(reference) {
    if (!this[kLocal]) {
      throw new Error(`${this} already destroyed`);
    }

    return this[kLocal].delete(reference);
  }
}
