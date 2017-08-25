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
import RemoteSession from './RemoteSession';
import { RemoteSetAction, LocalReferenceAction } from './actions';
import LocalReference from './LocalReference';
import LocalSnapshot from './LocalSnapshot';

const kSession = Symbol('session');
const kSessionListener = Symbol('sessionListener');
const kDispatchSet = Symbol('dispatchSet');
const kDispatchSnapshots = Symbol('dispatchSnapshots');

/**
 * A local context that will represent the remote context of the other peer.
 */
export default class LocalContext extends AssignableContext {
  /**
   * @param {RemoteSession} session
   * @param {ReferenceContext} parentContext
   * @param {object} opts Options for {@link AssignableContext.constructor}
   */
  constructor(session, parentContext, opts = {}) {
    if (!(session instanceof RemoteSession)) {
      throw new TypeError(
        `Expect session to be instance of RemoteSession: ${session}`
      );
    }
    super({}, parentContext, opts);

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
     * @type {Set}
     * @private
     */
    this[kDispatchSet] = new Set();

    /**
     * @type {Map}
     * @private
     */
    this[kDispatchSnapshots] = new Map();
  }

  /**
   * Get the context remote session
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
   * Generate a remote action for dispatching the given value remotely.
   *
   * @param {*} value The given value
   * @return {Action}
   */
  dispatch(value) {
    if (!this[kSession]) {
      throw new TypeError('RemoteSession already closed');
    }

    const reference = this.assign(value);

    if (!this[kDispatchSet].has(reference)) {
      this[kDispatchSet].add(reference);

      const snapshot = new LocalSnapshot(value);
      this[kDispatchSnapshots].set(value, snapshot);

      return RemoteSetAction.fromSnapshot(this[kSession], reference, snapshot);
    }

    const localReference = new LocalReference(this[kSession], reference);
    this[kDispatchSnapshots].get(value).update(localReference);

    return new LocalReferenceAction(reference);
  }

  /**
   * @override
   */
  set(reference, value) {
    this[kDispatchSet].delete(reference);

    return super.set(reference, value);
  }

  /**
   * @override
   */
  delete(reference) {
    this[kDispatchSet].delete(reference);
    return super.delete(reference);
  }

  /**
   * @override
   */
  release(value) {
    this[kDispatchSnapshots].delete(value);
    return super.release(value);
  }

  /**
   * @override
   */
  clear() {
    this[kDispatchSet].clear();
    this[kDispatchSnapshots].clear();

    return super.clear();
  }

  /**
   * End the remote session.
   *
   * @return {LocalContext}
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

      if (!(this.parent instanceof LocalContext)) {
        this[kSession].destroy();
      }
    }

    delete this[kSession];
    delete this[kSessionListener];

    this.clear();
  }
}
