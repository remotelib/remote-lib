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

import { trimArgumentsList } from 'remote-instance';
import RemoteSetAction from './RemoteSetAction';
import PropertyDescriptorsAction from './PropertyDescriptorsAction';

const ARRAY_PROTOTYPE_CODE = 1;

export default class RemoteSetObjectAction extends RemoteSetAction {
  static fromValue(session, reference, obj) {
    if (obj === null) return null;

    // Fetch order should be the same: first prototype then the descriptors
    const proto = session.dispatch(this.getPrototype(obj));
    const descriptors = PropertyDescriptorsAction.fromObject(session, obj);
    const isExtensible = Object.isExtensible(obj);

    return new this(
      reference,
      descriptors.isEmpty() ? null : descriptors,
      proto,
      isExtensible
    );
  }

  static getPrototype(obj) {
    const proto = Object.getPrototypeOf(obj);

    if (proto === Object.prototype) {
      return null;
    }

    if (proto === Array.prototype) {
      return ARRAY_PROTOTYPE_CODE;
    }

    return proto;
  }

  constructor(
    reference,
    descriptors = null,
    proto = null,
    isExtensible = true
  ) {
    if (
      descriptors !== null &&
      !(descriptors instanceof PropertyDescriptorsAction)
    ) {
      throw new TypeError(`Invalid descriptors: ${descriptors}`);
    }
    if (typeof proto !== 'object') {
      if (proto !== ARRAY_PROTOTYPE_CODE) {
        throw new TypeError('Object prototype may only be an Object or null');
      }
    }
    if (typeof isExtensible !== 'boolean') {
      throw new TypeError('Expect "isExtensible" to be boolean');
    }

    super(reference);

    this.descriptors = descriptors;
    this.proto = proto;
    this.isExtensible = isExtensible;
  }

  // eslint-disable-next-line class-methods-use-this
  createInstance() {
    if (this.proto === ARRAY_PROTOTYPE_CODE) {
      return [];
    }

    return {};
  }

  populateInstance(session, instance) {
    // Fetch order the same as dispatch order
    const proto = this.constructor.fetch(session, this.proto);
    const descriptors = this.constructor.fetch(session, this.descriptors);

    if (proto !== null && typeof proto === 'object') {
      Object.setPrototypeOf(instance, proto);
    }

    if (descriptors !== null) {
      Object.defineProperties(instance, descriptors);
    }
  }

  toArgumentsList() {
    const argumentsList = [
      this.reference,
      this.descriptors,
      this.proto,
      this.isExtensible,
    ];
    const defaults = [undefined, null, null, true];

    return trimArgumentsList(argumentsList, defaults);
  }
}

RemoteSetAction.types.object = RemoteSetObjectAction;
