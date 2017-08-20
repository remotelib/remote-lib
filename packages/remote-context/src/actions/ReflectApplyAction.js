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

export default class ReflectApplyAction extends ReflectAction {
  static fromProxy(session, target, thisArg, argumentsList) {
    return new this(
      target,
      session.dispatch(thisArg),
      argumentsList.map(arg => session.dispatch(arg))
    );
  }

  constructor(target, thisArg = null, argumentsList = []) {
    if (!Array.isArray(argumentsList)) {
      throw new TypeError(
        `Expect argumentsList to be an Array: ${argumentsList}`
      );
    }
    super(target);

    this.thisArg = thisArg;
    this.argumentsList = argumentsList;
  }

  fetch(session) {
    const target = this.fetchTarget(session);
    const thisArg = this.constructor.fetch(session, this.thisArg);
    const argumentsList = this.argumentsList.map(arg =>
      this.constructor.fetch(session, arg)
    );

    return Reflect.apply(target, thisArg, argumentsList);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    const argumentsList = [this.target, this.thisArg, this.argumentsList];
    const defaults = [undefined, null, []];

    return trimArgumentsList(argumentsList, defaults);
  }
}
