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
import ReflectAction from './ReflectAction';

export default class ReflectConstructAction extends ReflectAction {
  static fromProxy(session, target, argumentsList) {
    return new this(target, argumentsList.map(arg => session.dispatch(arg)));
  }

  constructor(target, argumentsList = []) {
    if (!Array.isArray(argumentsList)) {
      throw new TypeError(
        `Expect argumentsList to be an Array: ${argumentsList}`
      );
    }
    super(target);

    this.argumentsList = argumentsList;
  }

  fetch(session) {
    const target = this.fetchTarget(session);
    const argumentsList = this.argumentsList.map(arg =>
      this.constructor.fetch(session, arg)
    );

    return Reflect.construct(target, argumentsList);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    const argumentsList = [this.target, this.argumentsList];
    const defaults = [undefined, []];

    return trimArgumentsList(argumentsList, defaults);
  }
}
