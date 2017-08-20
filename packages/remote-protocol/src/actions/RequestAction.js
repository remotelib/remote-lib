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

import Action from './Action';
import ResponseAction from './ResponseAction';

/**
 * @example
 * import { RequestAction } from 'remote-protocol';
 *
 * const action = new RequestAction(id, action);
 */
export default class RequestAction extends Action {
  /**
   * Create a request with given request id and action to fetch.
   *
   * @param {*} id The request id
   * @param {Action} action The action that was requested to fetch
   */
  constructor(id, action) {
    if (typeof id !== 'number') {
      throw new TypeError(`Expect id to be number: ${id}`);
    }

    if (!(action instanceof Action)) {
      throw new TypeError(`Expect action to be instance of Action: ${action}`);
    }

    super();

    /**
     * The request id
     * @type {*}
     */
    this.id = id;

    /**
     * The action that was requested to fetch
     * @type {Action}
     */
    this.action = action;
  }

  /**
   * @override
   */
  fetch(session) {
    return this.action.fetch(session);
  }

  /**
   * @override
   */
  exec(session) {
    try {
      const value = this.fetch(session);
      session.send(new ResponseAction(this.id, session.dispatch(value)));
    } catch (error) {
      session.send(new ResponseAction(this.id, session.dispatch(error), true));
    }
  }

  /**
   * @override
   */
  toArgumentsList() {
    return [this.id, this.action];
  }
}
