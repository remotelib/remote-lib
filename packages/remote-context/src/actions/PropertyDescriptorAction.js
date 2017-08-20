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

import { Action } from 'remote-protocol';
import { trimArgumentsList } from 'remote-instance';
import UndefinedValueAction from './UndefinedValueAction';

/**
 * @extends {Action}
 */
export default class PropertyDescriptorAction extends Action {
  static fromProperty(session, obj, prop) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

    return this.fromPropertyDescriptor(session, descriptor);
  }

  static fromPropertyDescriptor(session, descriptor) {
    return new this(
      session.dispatch(descriptor.value),
      descriptor.configurable === true,
      descriptor.writable === true,
      descriptor.enumerable === true,
      descriptor.get ? session.dispatch(descriptor.get) : null,
      descriptor.set ? session.dispatch(descriptor.set) : null
    );
  }

  constructor(
    value = undefined,
    configurable = true,
    writable = true,
    enumerable = true,
    get = null,
    set = null
  ) {
    if (typeof configurable !== 'boolean') {
      throw new TypeError('Argument "configurable" must be a boolean');
    }
    if (typeof writable !== 'boolean') {
      throw new TypeError('Argument "writable" must be a boolean');
    }
    if (typeof enumerable !== 'boolean') {
      throw new TypeError('Argument "enumerable" must be a boolean');
    }
    if (!UndefinedValueAction.isUndefined(value) || writable) {
      if (get !== null || set !== null) {
        throw new TypeError(
          'Invalid property descriptor. ' +
            'Cannot both specify accessors and a value or writable attribute'
        );
      }
    }
    super();

    this.value = value;
    this.configurable = configurable;
    this.writable = writable;
    this.enumerable = enumerable;
    this.get = get;
    this.set = set;
  }

  fetch(session) {
    if (this.get === null && this.set === null) {
      const value = this.constructor.fetch(session, this.value);

      return {
        value,
        configurable: this.configurable,
        writable: this.writable,
        enumerable: this.enumerable,
      };
    }

    const get = this.constructor.fetch(session, this.get) || undefined;
    const set = this.constructor.fetch(session, this.set) || undefined;

    if (get !== undefined && typeof get !== 'function') {
      throw new TypeError('Argument "get" must be a function or null');
    }
    if (set !== undefined && typeof set !== 'function') {
      throw new TypeError('Argument "set" must be a function or null');
    }

    return {
      configurable: this.configurable,
      enumerable: this.enumerable,
      get,
      set,
    };
  }

  toArgumentsList() {
    const argumentsList = [
      this.value,
      this.configurable,
      this.writable,
      this.enumerable,
      this.get,
      this.set,
    ];
    const defaults = [undefined, true, true, true, null, null];

    return trimArgumentsList(argumentsList, defaults);
  }
}
