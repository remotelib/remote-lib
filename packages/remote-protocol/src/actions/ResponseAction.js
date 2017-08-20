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

/**
 * @example
 * import { ResponseAction } from 'remote-protocol';
 *
 * const action = new ResponseAction(requestId, value, false);
 */
export default class ResponseAction extends Action {
  /**
   * Create a response for an executed action.
   *
   * @param {*} requestId The request id
   * @param {*} value The given response value or error to fetch
   * @param {boolean} rejected True if the given value should be thrown when fetching this action
   */
  constructor(requestId, value, rejected = false) {
    if (typeof requestId !== 'number') {
      throw new TypeError(`Expect request id to be number: ${requestId}`);
    }
    if (typeof rejected !== 'boolean') {
      throw new TypeError(`Invalid rejected argument: ${rejected}`);
    }
    super();

    /**
     * The request id
     * @type {*}
     */
    this.requestId = requestId;

    /**
     * The given response value or error
     * @type {*}
     */
    this.value = value;

    /**
     * True if the given value thrown while executing the requested action
     * @type {boolean}
     */
    this.rejected = rejected;
  }

  /**
   * @override
   */
  fetch(session) {
    return this.constructor.fetch(session, this.value);
  }

  /**
   * @override
   */
  exec(session) {
    session.response(this.requestId, this.fetch(session), this.rejected);
  }

  /**
   * @override
   */
  toArgumentsList() {
    if (!this.rejected) {
      if (this.value === undefined) {
        return [this.requestId];
      }

      return [this.requestId, this.value];
    }

    return [this.requestId, this.value, this.rejected];
  }
}
