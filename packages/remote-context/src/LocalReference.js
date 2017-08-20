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

import RemoteSession from './RemoteSession';
import LocalContext from './LocalContext';
import {
  RemoteDefinePropertyAction,
  RemoteDeletePropertyAction,
  RemoteSetPrototypeOfAction,
  RemotePreventExtensionsAction,
} from './actions';

const kSession = Symbol('session');
const kReference = Symbol('reference');

/**
 * A reference to a local value. Any change to the LocalReference will be send to the remote peer.
 */
export default class LocalReference {
  /**
   * Create a reference to a local value.
   *
   * @param {RemoteSession} session The reference remote session
   * @param {Reference} reference The local reference id
   */
  constructor(session, reference) {
    if (!(session instanceof RemoteSession)) {
      throw new TypeError(
        `Expect session to be instance of RemoteSession: ${session}`
      );
    }
    if (!LocalContext.isValidReference(reference)) {
      throw new TypeError(`The given reference is not valid: ${reference}`);
    }

    /**
     * @type {RemoteSession}
     * @private
     */
    this[kSession] = session;

    /**
     * @type {Reference}
     * @private
     */
    this[kReference] = reference;
  }

  /**
   * Set the prototype of the reference value.
   *
   * @param {object|function} prototype The new prototype
   * @return {boolean} True on success
   */
  setPrototypeOf(prototype) {
    this[kSession].send(
      RemoteSetPrototypeOfAction.fromLocal(
        this[kSession],
        this[kReference],
        prototype
      )
    );

    return true;
  }

  /**
   * prevent extensions on the reference value.
   *
   * @return {boolean} True on success
   */
  preventExtensions() {
    this[kSession].send(
      RemotePreventExtensionsAction.fromLocal(this[kSession], this[kReference])
    );

    return true;
  }

  /**
   * Define a property on the reference value.
   *
   * @param {Property} property The property
   * @param {Descriptor} descriptor The property descriptor
   * @return {boolean} True on success
   */
  defineProperty(property, descriptor) {
    this[kSession].send(
      RemoteDefinePropertyAction.fromLocal(
        this[kSession],
        this[kReference],
        property,
        descriptor
      )
    );

    return true;
  }

  /**
   * Define a property from the reference value.
   *
   * @param {Property} property The property
   * @return {boolean} True on success
   */
  deleteProperty(property) {
    this[kSession].send(
      RemoteDeletePropertyAction.fromLocal(
        this[kSession],
        this[kReference],
        property
      )
    );

    return true;
  }
}
