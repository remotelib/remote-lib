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
import PropertyDescriptorAction from './PropertyDescriptorAction';

/**
 * @extends {Action}
 */
export default class PropertyDescriptorsAction extends Action {
  static fromObject(session, obj) {
    const descriptors = Object.getOwnPropertyDescriptors(obj);

    return this.fromPropertyDescriptors(session, descriptors);
  }

  static fromPropertyDescriptors(session, descriptors) {
    return new this(
      Object.keys(descriptors).reduce((arr, property) => {
        arr.push(
          property,
          PropertyDescriptorAction.fromPropertyDescriptor(
            session,
            descriptors[property]
          )
        );
        return arr;
      }, [])
    );
  }

  constructor(descriptors = []) {
    if (!Array.isArray(descriptors) || descriptors.length % 2 !== 0) {
      throw new TypeError(`Invalid descriptors array: ${descriptors}`);
    }
    super();

    this.descriptors = descriptors;
  }

  isEmpty() {
    return !this.descriptors.length;
  }

  fetch(session) {
    const descriptors = {};

    for (let i = 0; i < this.descriptors.length; i += 2) {
      const property = this.constructor.fetch(session, this.descriptors[i]);

      descriptors[property] = this.constructor.fetch(
        session,
        this.descriptors[i + 1]
      );
    }

    return descriptors;
  }

  toArgumentsList() {
    if (!this.descriptors.length) return [];

    return [this.descriptors];
  }
}
