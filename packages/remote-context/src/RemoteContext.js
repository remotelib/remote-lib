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
import RemoteSession from './RemoteSession';
import RemoteValue, { revoke, reveal } from './RemoteValue';
import RemotePromise from './RemotePromise';
import LocalPromise from './LocalPromise';

const { GetAction, DeleteAction, RemoteReferenceAction } = require('./actions');

const kSession = Symbol('session');
const kSessionListener = Symbol('sessionListener');
const kFetchRequests = Symbol('fetchRequests');

/**
 * A remote context that will represent the local context of the other peer.
 * @extends {ReferenceContext}
 * @example
 * import { RemoteContext } from 'remote-context';
 *
 * const remoteContext = new RemoteContext(session, parentContext);
 */
export default class RemoteContext extends ReferenceContext {
  /**
   * Create a remote context with given remote session and environment context.
   *
   * @param {RemoteSession} session The remote session
   * @param {ReferenceContext} parentContext The environment context
   */
  constructor(session, parentContext) {
    if (!(session instanceof RemoteSession)) {
      throw new TypeError(
        `Expect session to be instance of RemoteSession: ${session}`
      );
    }

    super({}, parentContext);

    /**
     * @type {RemoteSession}
     * @private
     */
    this[kSession] = session;

    /**
     * @type {function}
     * @private
     * @return {void}
     */
    this[kSessionListener] = () => {
      session.removeListener('close', this[kSessionListener]);

      this[kSessionListener] = null;
      this[kSession] = null;

      this.destroy();
    };
    session.on('close', this[kSessionListener]);

    /**
     * @type {Map}
     * @private
     */
    this[kFetchRequests] = new Map();
  }

  /**
   * Get the context remote session.
   *
   * @type {RemoteSession}
   */
  get session() {
    return this[kSession];
  }

  /**
   * @override
   */
  closure() {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    return new this.constructor(this[kSession], this);
  }

  /**
   * Fetch a remote reference and return a remote promise.
   * If the value already fetched, return a remote promise of the same value.
   *
   * @param {Reference} reference The remote reference to fetch
   * @param {object} [opts] {@link RemotePromise.constructor} options
   * @return {RemotePromise}
   */
  fetch(reference, opts = {}) {
    let promise = this[kFetchRequests].get(reference);
    if (promise) return promise;

    promise = new RemotePromise(this[kSession], new GetAction(reference), opts);
    this[kFetchRequests].set(reference, promise);

    return promise;
  }

  /**
   * Resolve a remote value and return a remote promise to that value.
   * If the value is not a remote value, return a local promise to the same value.
   *
   * @param {*} value The remote value to resolve
   * @param {object} [opts] {@link RemoteContext.fetch} options
   * @return {RemotePromise|LocalPromise}
   */
  resolve(value, opts = {}) {
    if (!(value instanceof Object) || !this.exists(value)) {
      return new LocalPromise(value);
    }

    const reference = this.lookup(value);
    this[kFetchRequests].delete(reference);

    return this.fetch(reference, opts);
  }

  /**
   * Generate a remote action for dispatching the given value remotely.
   *
   * @param {*} value The given value
   * @throws {ReferenceError} If the value is not {@link RemoteContext#exists}
   * @return {Action}
   */
  dispatch(value) {
    return new RemoteReferenceAction(this.lookup(value));
  }

  /**
   * Get an {@link RemoteValue} instance for the given reference value.
   *
   * @param {Reference} reference The remote reference
   * @throws {ReferenceError} If the context not {@link RemoteContext#has} the given reference
   * @return {RemoteValue}
   */
  getTarget(reference) {
    return reveal(this.get(reference));
  }

  /**
   * @override
   */
  set(reference, value) {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    const remoteValue = new RemoteValue(this[kSession], reference, value);
    return super.set(reference, remoteValue);
  }

  /**
   * @override
   */
  delete(reference) {
    this[kFetchRequests].delete(reference);
    if (!super.delete(reference)) return false;

    if (this[kSession] && !this[kSession].isEnded) {
      this[kSession].send(new DeleteAction(reference));
    }

    return true;
  }

  /**
   * @override
   */
  release(value) {
    if (!this.parent || !this.parent.exists(value)) {
      revoke(value);
    }

    return super.release(value);
  }

  /**
   * @override
   */
  clear() {
    this.forEach((value, reference) => {
      if (this[kSession] && !this[kSession].isEnded) {
        this[kSession].send(new DeleteAction(reference));
      }

      if (!this.parent || !this.parent.exists(value)) {
        revoke(value);
      }
    });

    this[kFetchRequests].clear();
    super.clear();
  }

  /**
   * End the remote session.
   *
   * @return {RemoteContext}
   */
  end() {
    if (this[kSession]) {
      this[kSession].end();
    }

    return this;
  }

  /**
   * Clear the context and destroy the context session only if this context IS NOT created via
   * closure.
   *
   * @return {void}
   */
  destroy() {
    if (this[kSession]) {
      if (this[kSessionListener]) {
        this[kSession].removeListener('close', this[kSessionListener]);
      }

      if (!(this.parent instanceof RemoteContext)) {
        this[kSession].destroy();
      }
    }

    delete this[kSession];
    delete this[kSessionListener];

    this.clear();
  }

  /**
   * Listen to an event on the remote session.
   *
   * @param {string} event The event to listen to
   * @param {function} listener The listener
   * @return {RemoteContext}
   */
  on(event, listener) {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    this[kSession].on(event, listener);
    return this;
  }

  /**
   * Listen once to an event on the remote session.
   *
   * @param {string} event The event to listen to
   * @param {function} listener The listener
   * @return {RemoteContext}
   */
  once(event, listener) {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    this[kSession].once(event, listener);
    return this;
  }

  /**
   * Remove listener from the remote session.
   *
   * @param {string} event The event on the listener
   * @param {function} listener The listener
   * @return {RemoteContext}
   */
  removeListener(event, listener) {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    this[kSession].removeListener(event, listener);
    return this;
  }
}
