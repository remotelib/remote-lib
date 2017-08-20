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

import { Context } from 'remote-context';
import envContext from 'remote-context/envs/es6-unstable';

const kOpts = Symbol('options');

/**
 * A local library that can be served.
 *
 * @extends {Context}
 * @example
 * import { Library } from 'remote-lib';
 *
 * const library = new Library(context);
 */
export default class Library extends Context {
  /**
   * Create a local library with a given context.
   *
   * @param {object} context The library context
   * @param {object} [opts] {@link Context} & {@link RemoteSession} options
   * @param {EnvContext} [opts.env] An alternative environment context (Default: `es6-unstable`)
   */
  constructor(context, opts = {}) {
    const env = opts.env !== undefined ? opts.env : envContext;
    super(env, context, opts);

    /**
     * @type {Object}
     * @private
     */
    this[kOpts] = opts;
  }

  /**
   * Serve this library to other peer.
   * A single library can be served to multiple peers, each peer will get a separate copy of the
   * library.
   *
   * @see {@link Context#remote}
   * @param {Stream} stream a duplex stream to other peer remote-library
   * @return {void}
   */
  serve(stream) {
    super.remote(stream, this[kOpts]);
  }
}
