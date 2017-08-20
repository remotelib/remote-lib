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

import EventEmitter from 'events';
import { randomBytes } from 'crypto';
import { Action, RequestAction } from './actions';

const kStream = Symbol('stream');
const kRequestTimeout = Symbol('requestTimeout');
const kNextReqId = Symbol('nextReqId');
const kRequestsMap = Symbol('requestsMap');
const kRequestsTimer = Symbol('requestsTimer');
const kEndTimeout = Symbol('endedTimeout');
const kEndTimer = Symbol('isEnded');

// Default timeout for request
const REQUEST_DEFAULT_TIMEOUT = 20e3; // 20 seconds

// How often check for timeout requests
const REQUEST_TIMEOUT_INTERVAL = 100; // 100ms

// If there are open requests, how much time to wait before closing the connection
const SESSION_END_DEFAULT_TIMEOUT = 200; // 200 milliseconds

const REQUEST_ID_BYTES = 4;
const MAX_OPEN_REQUESTS = 256 ** REQUEST_ID_BYTES;

function generateRequestId() {
  return randomBytes(REQUEST_ID_BYTES).readUIntBE(0, REQUEST_ID_BYTES);
}

/**
 * @example
 * import { Session } from 'remote-protocol';
 *
 * const session = new Session(objectStream);
 */
export default class Session extends EventEmitter {
  /**
   * Create a new session with an object-stream to the other peer.
   *
   * @param {Stream} objectStream An object duplex stream
   * @param {object} [opts] Options
   * @param {null|number} [opts.timeout=20e3] Default timeout for requests in milliseconds. If
   * null is given, request will not timeout.
   * @param {null|number} [opts.endTimeout=200] Default timeout to end the session in
   * milliseconds after the other ended the stream.
   */
  constructor(objectStream, opts = {}) {
    if (
      typeof objectStream !== 'object' ||
      typeof objectStream.on !== 'function' ||
      typeof objectStream.write !== 'function'
    ) {
      throw new TypeError(`Invalid stream argument: ${objectStream}`);
    }

    super();

    // for promises that listen for close event
    this.setMaxListeners(0);

    const { timeout, endTimeout } = opts;
    if (timeout !== undefined) {
      if (timeout !== null && typeof timeout !== 'number') {
        throw new TypeError(`Invalid "timeout" option: ${timeout}`);
      }

      /**
       * @type {null|number}
       * @private
       */
      this[kRequestTimeout] = timeout;
    } else {
      this[kRequestTimeout] = REQUEST_DEFAULT_TIMEOUT;
    }

    if (endTimeout !== undefined) {
      if (typeof endTimeout !== 'number') {
        throw new TypeError(`Invalid "endTimeout" option: ${endTimeout}`);
      }

      /**
       * @type {null|number}
       * @private
       */
      this[kEndTimeout] = endTimeout;
    } else {
      this[kEndTimeout] = SESSION_END_DEFAULT_TIMEOUT;
    }

    /**
     * @type {Stream}
     * @private
     */
    this[kStream] = objectStream;

    /**
     * @type {number}
     * @private
     */
    this[kNextReqId] = generateRequestId();

    /**
     * @type {Map}
     * @private
     */
    this[kRequestsMap] = new Map();

    /**
     * @type {null|TimeoutID}
     * @private
     */
    this[kRequestsTimer] = null;

    this[kStream].on('data', action => {
      if (!(action instanceof Action)) {
        this.destroy(
          new TypeError(`Unrecognized action received: ${typeof action}`),
        );
        return;
      }

      try {
        Promise.resolve(action.exec(this)).catch(err => {
          if (!this[kStream]) return;

          this.destroy(err);
        });
      } catch (err) {
        this.destroy(err);
      }
    });

    this[kStream].on('end', () => {
      if (!this[kStream]) return;

      const requests = this[kRequestsMap];
      this[kRequestsMap] = null;

      requests.forEach(({ onRejected }) => {
        onRejected(new Error('Session ended before request completed'));
      });

      this.emit('end');

      if (this.isEnded) {
        this[kStream] = null;
        this.destroy();
        return;
      }

      if (this[kEndTimeout]) {
        /**
         * @type {TimeoutID}
         * @private
         */
        this[kEndTimer] = setTimeout(() => {
          this[kEndTimer] = true;
          this.destroy();
        }, this[kEndTimeout]);
      }
    });

    this[kStream].on('finish', () => {
      if (!this[kStream]) return;

      this.emit('finish');

      if (!this[kRequestsMap]) {
        this[kStream] = null;
        this.destroy();
      }
    });

    this[kStream].on('close', () => {
      if (!this[kStream]) return;

      this[kStream] = null;
      this.destroy();
    });

    this[kStream].on('error', err => {
      if (!this[kStream]) return;

      this[kStream] = null;
      this.destroy(err);
    });
  }

  /**
   * True if the session is open.
   * @type {boolean}
   */
  get isOpen() {
    return !!this[kStream];
  }

  /**
   * True if the session is no longer readable.
   * @type {boolean}
   */
  get isEnded() {
    return !this[kStream] || this[kStream].ended;
  }

  /**
   * The number of requests sent and waiting for response.
   * @type {number}
   */
  get openRequests() {
    if (!this[kRequestsMap]) return 0;

    return this[kRequestsMap].size;
  }

  /**
   * Return session constructor name.
   *
   * @override
   * @return {string}
   */
  toString() {
    return this.constructor.name;
  }

  /**
   * Convert the given value to a value that can be send ove to the other peer.
   * If the value can be send as-is, return the same value (default implementation).
   *
   * @param {*} value The value to dispatch
   * @return {*}
   */
  // eslint-disable-next-line class-methods-use-this
  dispatch(value) {
    return value;
  }

  /**
   * Send an action for execution to the other peer.
   *
   * @param {Action} action The action to send
   * @return {Session}
   */
  send(action) {
    if (!(action instanceof Action)) {
      throw new TypeError(
        `Expect first argument to be instance of Action: ${action}`,
      );
    }

    if (!this[kStream]) {
      throw new Error(`${this} already destroy`);
    }

    this[kStream].write(action);
    return this;
  }

  /**
   * Request from the other peer to fetch the given action and send back it's response value.
   *
   * @param {Action} action the given action to fetch by the peer
   * @param {object} [opts] Options
   * @param {number|null} [opts.timeout] Override the default timeout for this request (See {@link constructor}).
   * @param {function} onFulfilled a function that will be called with the response value on the
   * first arguments as-is (ie. without `Promise.resolve`).
   * @param {function} onRejected a function that will be called with an error at the first
   * argument if the fetching throws an error or the request timeout as reached.
   * @return {Session}
   */
  request(action, ...args) {
    let opts;
    let onFulfilled;
    let onRejected;

    if (args.length < 3) {
      opts = {};
      onFulfilled = args[0];
      onRejected = args[1];
    } else {
      opts = args[0];
      onFulfilled = args[1];
      onRejected = args[2];

      if (typeof opts !== 'object') {
        throw new TypeError(`Expect "options" to be an object: ${typeof opts}`);
      }
    }

    if (!(action instanceof Action)) {
      throw new TypeError(
        `Expect "action" to be instance of Action: ${action}`,
      );
    }

    if (typeof onFulfilled !== 'function') {
      throw new TypeError(
        `Expect "onFulfilled" to be a function: ${typeof onFulfilled}`,
      );
    }

    if (typeof onRejected !== 'function') {
      throw new TypeError(
        `Expect "onRejected" to be a function: ${typeof onRejected}`,
      );
    }

    if (!this[kStream]) {
      throw new Error(`${this} already destroyed`);
    }

    if (!this[kRequestsMap] || this.isEnded) {
      throw new Error('Session already ended');
    }

    let { timeout } = opts;
    if (timeout !== undefined) {
      if (timeout !== null && typeof timeout !== 'number') {
        throw new TypeError(`Invalid "timeout" option: ${timeout}`);
      }
    } else {
      timeout = this[kRequestTimeout];
    }

    let waitUntil;
    if (timeout) {
      waitUntil = Date.now() + timeout;
    } else {
      waitUntil = null;
    }

    const reqId = this.fetchRequestId();

    this[kRequestsMap].set(reqId, {
      waitUntil,
      onFulfilled,
      onRejected,
    });

    this.send(new RequestAction(reqId, action));

    if (!this[kRequestsTimer]) {
      this.requestsTimeoutInterval();
    }

    return this;
  }

  /**
   * End this session stream.
   * @return {Session}
   */
  end() {
    if (this[kStream]) {
      this[kStream].end();
    }

    return this;
  }

  /**
   * Destroy this session and it's stream.
   *
   * @emits {error} If an error given, emit and "error" event as well.
   * @emits {close} When the session destroyed
   * @param {Error} [err] Optional error
   * @return {void}
   */
  destroy(err) {
    if (this[kRequestsMap] === undefined) return;

    if (this[kStream]) {
      const stream = this[kStream];
      delete this[kStream];

      stream.destroy();
    }

    if (this[kRequestsTimer]) {
      clearTimeout(this[kRequestsTimer]);
    }

    if (this[kEndTimer]) {
      clearTimeout(this[kEndTimer]);
    }

    const requests = this[kRequestsMap];

    delete this[kRequestTimeout];
    delete this[kNextReqId];
    delete this[kRequestsMap];
    delete this[kRequestsTimer];
    delete this[kEndTimer];
    delete this[kStream];

    if (requests && requests.size) {
      requests.forEach(({ onRejected }) => {
        onRejected(err || new Error('Session closed before request completed'));
      });
    } else if (err) {
      this.emit('error', err);
    }

    this.emit('close');
    this.removeAllListeners();
  }

  // Actions methods

  /**
   * @ignore
   *
   * @param {number} reqId
   * @param {*|undefined} value
   * @param {*|undefined} rejected
   * @return {void}
   */
  response(reqId, value, rejected) {
    if (!this[kRequestsMap]) {
      throw new Error("Can't handle response, session already ended");
    }

    const req = this[kRequestsMap].get(reqId);
    if (!req) {
      throw new Error(`Response already sent: ${reqId}`);
    }

    this[kRequestsMap].delete(reqId);
    const { onFulfilled, onRejected } = req;

    if (!rejected) {
      onFulfilled(value);
    } else {
      onRejected(value);
    }
  }

  // Internal methods

  /**
   * @private
   * @return {void}
   */
  requestsTimeoutInterval() {
    this[kRequestsTimer] = null;
    if (!this[kRequestsMap]) return;

    const now = Date.now();
    const requests = [];
    let isDone = true;

    this[kRequestsMap].forEach(({ waitUntil }, key) => {
      if (!waitUntil) return;

      if (waitUntil > now) {
        if (isDone) isDone = false;
        return;
      }

      requests.push(key);
    });

    if (requests.length) {
      process.nextTick(() => {
        requests.forEach(reqId => {
          this.response(reqId, new Error('Request timeout'), true);
        });
      });
    }

    if (isDone) return;

    this[kRequestsTimer] = setTimeout(
      () => this.requestsTimeoutInterval(),
      REQUEST_TIMEOUT_INTERVAL,
    );

    if (this[kRequestsTimer].unref) this[kRequestsTimer].unref();
  }

  /**
   * @private
   * @return {number}
   */
  fetchRequestId() {
    if (!this[kRequestsMap]) {
      throw new Error("Can't fetch request id, session already ended");
    }

    let reqId;

    if (this[kRequestsMap].size >= MAX_OPEN_REQUESTS) {
      throw new Error(
        `Maximum open requests number reached: ${MAX_OPEN_REQUESTS}`,
      );
    }

    do {
      reqId = this[kNextReqId];
      this[kNextReqId] += 1;

      if (this[kNextReqId] >= MAX_OPEN_REQUESTS) {
        return 0;
      }
    } while (this[kRequestsMap].has(reqId));

    return reqId;
  }
}
