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

import bl from 'bl';
import deepEqual from 'deep-equal';
import msgPack5 from 'msgpack5';
import duplexify from 'duplexify';

const TYPE_CODE_MIN = 0x01;
const TYPE_CODE_MAX = 0xff;
const kParser = Symbol('parser');

/**
 * @example
 * import Parser from 'remote-instance';
 *
 * const parser = new Parser();
 */
export default class Parser {
  /**
   * Check if the given value is a remote-instance constructor.
   * An remote-instance constructor is a constructor with a method `toArgumentsList()`
   * that enable to get the construct arguments of this class to create it remotely.
   *
   * @param {function} constructor the given value to check
   * @return {boolean} True if it's a remote-instance constructor
   */
  static isConstructor(constructor) {
    return (
      typeof constructor === 'function' &&
      constructor.prototype != null &&
      typeof constructor.prototype.toArgumentsList === 'function'
    );
  }

  /**
   * Construct a new instance of the given constructor with the given arguments list.
   * If the constructor has a static method `fromArgumentsList(argumentsList)` this
   * function will use that function to construct the instance.
   *
   * @param {function} constructor The given constructor
   * @param {Array} [argumentsList] The given arguments list that will apply an the new operator.
   * @return {*} A new instance of the given constructor
   */
  static construct(constructor, argumentsList = []) {
    if (typeof constructor.fromArgumentsList === 'function') {
      return constructor.fromArgumentsList(argumentsList);
    }

    return new constructor(...argumentsList);
  }

  /**
   * Trim a given argument list to a shorter list by removing undefined or default values.
   * Default arguments comparing via strict deep-equal comparison.
   * For example, for the given argument list: `[1, 'foo', undefined, {}]` and the given
   * default: `[undefined, 'foo', 'bar', {}]`. The trimmed arguments list will be: `[1]`.
   *
   * @param {Array} argumentsList The given argument list
   * @param {Array} [defaults] The default arguments for this argument list.
   * @return {Array}
   */
  static trimArgumentsList(argumentsList, defaults = []) {
    let trimIndex = argumentsList.length;
    const opts = { strict: true };

    while (trimIndex > 0) {
      const index = trimIndex - 1;
      const arg = argumentsList[index];

      if (arg !== undefined && !deepEqual(arg, defaults[index], opts)) {
        break;
      }

      trimIndex = index;
    }

    return Array.prototype.slice.call(argumentsList, 0, trimIndex);
  }

  /**
   * Create an instance of remote-instance Parser.
   *
   * @param {object} [opts] The given options for the parser
   * @param {object} [opts.parser] An alternative `msgpack5` parser instance
   */
  constructor(opts = {}) {
    /**
     * @type {Object}
     * @private
     */
    this[kParser] = opts.parser || msgPack5();
  }

  /**
   * Register an instance on the parser with given type-code and constructor.
   * The type-code value must be consistent in all the remote devices for the given constructor.
   * The first argument could be also an object-map of type-codes and constructors instead.
   *
   * @param {number|object} typeCode The numeric type-code for this instance between `0x01` to
   * `0xff`.
   * @param {function} [constructor] A remote-instance constructor
   * @return {Parser}
   */
  register(typeCode, constructor) {
    if (
      typeof typeCode === 'object' &&
      Object.getPrototypeOf(typeCode) === Object.prototype
    ) {
      Object.keys(typeCode).forEach(key => {
        this.register(Number(key), typeCode[key]);
      });
      return this;
    }

    if (
      !Number.isInteger(typeCode) ||
      typeCode < TYPE_CODE_MIN ||
      typeCode > TYPE_CODE_MAX
    ) {
      throw new TypeError(
        `Expect typeCode to be integer between ${TYPE_CODE_MIN}-${TYPE_CODE_MAX}: ${typeCode}`,
      );
    }

    if (!this.constructor.isConstructor(constructor)) {
      throw new TypeError(
        `Expect constructor to have "toArgumentsList" method: ${constructor}`,
      );
    }

    this[kParser].register(
      typeCode,
      constructor,
      expr => this.encodeArgumentsList(expr.toArgumentsList()),
      buffer =>
        this.constructor.construct(
          constructor,
          this.decodeArgumentsList(buffer),
        ),
    );

    return this;
  }

  /**
   * Decode a given arguments list buffer.
   *
   * @param {Buffer|BufferList} buffer an encoded arguments list buffer
   * @return {Array} The decoded arguments list
   */
  decodeArgumentsList(buffer = bl()) {
    const bufferList = buffer instanceof bl ? buffer : bl().append(buffer);
    const argumentsList = [];

    while (bufferList.length) {
      argumentsList.push(this.decode(bufferList));
    }

    return argumentsList;
  }

  /**
   * Encode a given arguments list to a buffer.
   *
   * @param {Array} argumentsList The given arguments list
   * @return {BufferList} The encoded arguments list
   */
  encodeArgumentsList(argumentsList = []) {
    const bufferList = bl();

    // Trim undefined arguments
    let maxIndex = argumentsList.length - 1;
    while (maxIndex >= 0 && argumentsList[maxIndex] === undefined) {
      maxIndex -= 1;
    }

    // Encode only the necessary values
    for (let i = 0; i <= maxIndex; i += 1) {
      const buffer = this.encode(argumentsList[i]);
      bufferList.append(buffer);
    }

    return bufferList;
  }

  /**
   * Encode an value or an instance to a buffer.
   *
   * @param {*} value Any value or registered instance
   * @return {BufferList} The encoded buffer
   */
  encode(value) {
    return this[kParser].encode(value);
  }

  /**
   * Decode an value or an instance from an encoded buffer.
   *
   * @param {Buffer|BufferList} buffer The encoded buffer
   * @return {*} Any value or registered instance
   */
  decode(buffer) {
    return this[kParser].decode(buffer);
  }

  /**
   * Get an transform stream that convert objects to buffer.
   *
   * @return {Stream}
   */
  encoder() {
    return this[kParser].encoder();
  }

  /**
   * Get an transform stream that convert buffer to objects.
   *
   * @return {Stream}
   */
  decoder() {
    return this[kParser].decoder();
  }

  /**
   * Create a duplex stream that transform duplex buffer stream to object stream.
   *
   * @param {Stream} stream A duplex buffer stream
   * @param {object} [opts] An options object to construct the duplex stream with.
   *    The option `objectMode` is forced to be true.
   * @return {Stream} A duplex object stream
   */
  transform(stream, opts = {}) {
    const duplexReadable = this.decoder();
    const duplexWritable = this.encoder();

    stream.pipe(duplexReadable);
    duplexWritable.pipe(stream);

    const objectStream = duplexify(
      duplexWritable,
      duplexReadable,
      Object.assign(opts, {
        objectMode: true,
      }),
    );

    stream.on('error', err => objectStream.destroy(err));
    objectStream.on('close', () => stream.destroy());
    stream.on('close', () => objectStream.destroy());

    return objectStream;
  }
}

/**
 * @type {Parser.isConstructor}
 */
export const isConstructor = Parser.isConstructor;

/**
 * @type {Parser.construct}
 */
export const construct = Parser.construct;

/**
 * @type {Parser.trimArgumentsList}
 */
export const trimArgumentsList = Parser.trimArgumentsList;
