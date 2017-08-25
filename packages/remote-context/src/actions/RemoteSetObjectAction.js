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
import PropertyDescriptorAction from './PropertyDescriptorAction';
import { setCachedGetter } from '../helpers/descriptors';

const ARRAY_PROTOTYPE_CODE = 1;

function toPropertiesArray(session, obj, mapFn) {
  return Object.keys(obj).reduce((arr, property) => {
    arr.push(session.dispatch(property), mapFn(obj[property], property));
    return arr;
  }, []);
}

function isValidPropertiesArray(propsArr) {
  return Array.isArray(propsArr) && propsArr.length % 2 === 0;
}

function fromPropertiesArray(session, propsArr, forEachFn) {
  for (let i = 0; i < propsArr.length; i += 2) {
    const property = RemoteSetAction.fetch(session, propsArr[i]);
    const value = RemoteSetAction.fetch(session, propsArr[i + 1]);

    forEachFn(value, property);
  }
}

export default class RemoteSetObjectAction extends RemoteSetAction {
  static fromSnapshot(session, reference, snapshot) {
    const obj = snapshot.value;
    if (obj === null) return null;

    // Fetch order should be the same: first prototype then the descriptors
    const proto = session.dispatch(this.getPrototype(snapshot));

    const descriptors = toPropertiesArray(
      session,
      snapshot.ownPropertyDescriptors,
      desc => PropertyDescriptorAction.fromPropertyDescriptor(session, desc)
    );

    const isExtensible = Object.isExtensible(obj);

    const cachedGetters = toPropertiesArray(
      session,
      snapshot.cachedGetters,
      cachedValue => session.dispatch(cachedValue)
    );

    return new this(reference, descriptors, proto, isExtensible, cachedGetters);
  }

  static getPrototype(snapshot) {
    const proto = snapshot.prototype;

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
    descriptors = [],
    proto = null,
    isExtensible = true,
    cachedGetters = []
  ) {
    if (!isValidPropertiesArray(descriptors)) {
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

    if (!isValidPropertiesArray(cachedGetters)) {
      throw new TypeError(`Invalid "cachedGetters" param: ${cachedGetters}`);
    }

    super(reference);

    this.descriptors = descriptors;
    this.proto = proto;
    this.isExtensible = isExtensible;
    this.cachedGetters = cachedGetters;
  }

  // eslint-disable-next-line class-methods-use-this
  createInstance() {
    if (this.proto === ARRAY_PROTOTYPE_CODE) {
      return [];
    }

    return {};
  }

  populateInstance(session, instance) {
    // Fetch order the same as dispatch order (ie. first prototype then descriptors)
    // @see {@link RemoteSetObjectAction.fromValue}

    const proto = this.constructor.fetch(session, this.proto);
    if (proto !== null && typeof proto === 'object') {
      Object.setPrototypeOf(instance, proto);
    }

    fromPropertiesArray(session, this.descriptors, (descriptor, property) => {
      Object.defineProperty(instance, property, descriptor);
    });

    fromPropertiesArray(session, this.cachedGetters, (value, property) => {
      setCachedGetter(instance, property, value);
    });
  }

  toArgumentsList() {
    const argumentsList = [
      this.reference,
      this.descriptors,
      this.proto,
      this.isExtensible,
      this.cachedGetters,
    ];
    const defaults = [undefined, [], null, true, []];

    return trimArgumentsList(argumentsList, defaults);
  }
}

RemoteSetAction.types.object = RemoteSetObjectAction;
