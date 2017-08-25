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

/**
 * @example
 * import { Action } from 'remote-protocol';
 *
 * const action = new Action();
 */
export default class Action {
  /**
   * Get a string that represent this class.
   *
   * @override
   * @return {string} The class constructor name
   */
  toString() {
    return this.constructor.name;
  }

  /**
   * Fetch the action value.
   *
   * @param {Session} session The current action session
   * @throws {Error} If there is any error
   * @return {*} The action value
   */
  // eslint-disable-next-line no-unused-vars
  fetch(session) {
    throw new TypeError(`Fetch is not supported at: ${this}`);
  }

  /**
   * Execute the action.
   *
   * @see {fetch} The fetch method
   * @param {Session} session The current action session
   * @throws {Error} If there is a reason to close the session
   * @return {undefined|Promise} Returns `undefined` or a `Promise` if execution is asynchronous
   */
  // eslint-disable-next-line no-unused-vars
  exec(session) {
    throw new TypeError(`Execution is not supported at: ${this}`);
  }

  /**
   * Returns an arguments list for creating this instance remotely.
   *
   * @see {Parser} The 'remote-instance' module parser.
   * @return {Array} The arguments list
   */
  toArgumentsList() {
    throw new TypeError(`${this} #toArgumentsList() is not implemented`);
  }
}
