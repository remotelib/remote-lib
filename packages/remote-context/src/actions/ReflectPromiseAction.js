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

import ReflectAction from './ReflectAction';
import ReferenceAction from './ReferenceAction';
import ReflectApplyAction from './ReflectApplyAction';

export default class ReflectPromiseAction extends ReflectAction {
  static fromValue(session, target, resolve, reject) {
    return new this(target, session.assign(resolve), session.assign(reject));
  }

  constructor(target, resolve, reject) {
    if (!(resolve instanceof ReferenceAction)) {
      throw new TypeError(
        `Expect "resolve" to be reference to function: ${resolve}`
      );
    }
    if (!(reject instanceof ReferenceAction)) {
      throw new TypeError(
        `Expect "reject" to be reference to function: ${reject}`
      );
    }
    super(target);

    this.resolve = resolve;
    this.reject = reject;
  }

  fetch(session) {
    const target = this.fetchTarget(session);

    Promise.resolve(target)
      .then(
        value => {
          session.send(
            ReflectApplyAction.fromProxy(session, this.resolve, null, [value])
          );
        },
        error => {
          session.send(
            ReflectApplyAction.fromProxy(session, this.reject, null, [error])
          );
        }
      )
      .catch(err => {
        // We want to throw an error if no-one catch the `error` event on the session.
        // Therefore, we need to use a new stack without promise that the error could be thrown
        // to the process.
        process.nextTick(() => session.destroy(err));
      });
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    return [this.target, this.resolve, this.reject];
  }

  release(session) {
    this.resolve.release(session);
    this.resolve = null;

    this.reject.release(session);
    this.reject = null;
  }
}
