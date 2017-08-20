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
import RemoteSession from './RemoteSession';
import RemoteValue from './RemoteValue';
import {
  ReflectApplyAction,
  ReflectConstructAction,
  ReflectGetAction,
  ReflectPromiseAction,
} from './actions';

const kAction = Symbol('action');

/**
 * @example
 * const promise = new RemotePromise(remoteSession, action);
 *
 * // resolve the action value
 * promise.then(value => {
 *   // `value` is the resolve remote action value
 * });
 *
 * // resolve property of the action value
 * promise.find().then(value => {
 *   // `value` === resolveOnRemote(action.fetch().find())
 * });
 */
export default class RemotePromise {
  /**
   * Create a remote promise from a given action.
   *
   * @param {RemoteSession} session The remote session
   * @param {Action} action The given action
   * @param {object} [opts] {@link Session#request} options
   * @return {function} The remote promise
   */
  constructor(session, action, opts = {}) {
    if (!(session instanceof RemoteSession)) {
      throw new TypeError(
        `Expect "session" param to be instance of RemoteSession: ${session}`
      );
    }
    if (!(action instanceof Action)) {
      throw new TypeError(
        `Expect "action" param to be instance of Action: ${action}`
      );
    }

    // eslint-disable-next-line func-names
    const func = function() {
      throw new ReferenceError(
        "This is a remote-promise function and it should'nt be execute"
      );
    };

    func[kAction] = action;
    let promise;

    func.then = function then(onFulfilled, onRejected) {
      if (!promise) {
        promise = new Promise((resolve, reject) => {
          const rejectOnSessionClose = () =>
            reject(new Error('Session closed before promise resolved'));

          session.request(
            ReflectPromiseAction.fromValue(
              session,
              this[kAction],
              value => {
                session.removeListener('close', rejectOnSessionClose);

                RemoteValue.resolve(value).then(resolve, reject);
              },
              error => {
                session.removeListener('close', rejectOnSessionClose);
                reject(error);
              }
            ),
            opts,
            () => {
              session.once('close', rejectOnSessionClose);
            },
            error => {
              reject(error);
            }
          );
        });
      }

      return promise.then(onFulfilled, onRejected);
    };

    func.catch = function promiseCatch(onRejected) {
      return this.then(null, onRejected);
    };

    return new Proxy(func, {
      get(target, property) {
        if (property in target) return target[property];

        return new RemotePromise(
          session,
          ReflectGetAction.fromProxy(session, action, property),
          opts
        );
      },

      apply(target, thisArg, argumentsList) {
        return new RemotePromise(
          session,
          ReflectApplyAction.fromProxy(session, action, thisArg, argumentsList),
          opts
        );
      },

      construct(target, argumentsList) {
        return new RemotePromise(
          session,
          ReflectConstructAction.fromProxy(session, action, argumentsList),
          opts
        );
      },
    });
  }
}
