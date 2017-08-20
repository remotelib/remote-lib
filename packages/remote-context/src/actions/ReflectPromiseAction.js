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
import RemoteSetFunctionAction from './RemoteSetFunctionAction';

export default class ReflectPromiseAction extends ReflectAction {
  static fromValue(session, target, resolve, reject) {
    return new this(
      target,
      session.dispatch(resolve),
      session.dispatch(reject)
    );
  }

  constructor(target, resolve, reject) {
    if (!(resolve instanceof RemoteSetFunctionAction)) {
      throw new TypeError(`Expect "resolve" to be a function: ${resolve}`);
    }
    if (!(reject instanceof RemoteSetFunctionAction)) {
      throw new TypeError(`Expect "reject" to be a function: ${reject}`);
    }
    super(target);

    this.resolve = resolve;
    this.reject = reject;
  }

  fetch(session) {
    const target = this.fetchTarget(session);

    const resolve = this.constructor.fetch(session, this.resolve);
    const reject = this.constructor.fetch(session, this.reject);

    Promise.resolve(target)
      .then(
        value => {
          // TODO call resolve without promise
          resolve(value).catch(() => {});
        },
        error => {
          // TODO call reject without promise
          reject(error).catch(() => {});
        }
      )
      .then(
        () => {
          if (!session.isOpen) return;

          this.resolve.delete(session);
          this.reject.delete(session);
        },
        err => {
          session.destroy(err);
        }
      );
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    return [this.target, this.resolve, this.reject];
  }
}
