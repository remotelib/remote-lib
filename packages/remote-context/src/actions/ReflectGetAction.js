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
import ReflectAction from './ReflectAction';

export default class ReflectGetAction extends ReflectAction {
  static fromProxy(session, target, property) {
    return new this(target, session.dispatch(property));
  }

  constructor(target, property) {
    if (typeof property !== 'string' && !(property instanceof Action)) {
      throw new TypeError(
        `Expect property to be a string or an instance of Action: ${property}`,
      );
    }
    super(target);

    this.property = property;
  }

  fetch(session) {
    const target = this.fetchTarget(session);
    const property = this.constructor.fetch(session, this.property);

    return Reflect.get(target, property);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    return [this.target, this.property];
  }
}
