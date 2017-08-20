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

const kValue = Symbol('value');

/**
 * @example
 * const obj = {
 *   find: () => Promise.resolve('foo')
 * };
 *
 * const promise = new LocalPromise(obj);
 *
 * // resolve the value
 * promise.then(value => {
 *   // `value` === `obj`
 * });
 *
 * // resolve property of the value
 * promise.find().then(value => {
 *   // `value` === 'foo'
 * });
 */
export default class LocalPromise {
  /**
   * Create a local promise from a given value.
   *
   * @param {*} value The given value
   * @param {boolean} rejected True if the value should reject
   * @return {function} The local promise
   */
  constructor(value, rejected = false) {
    // eslint-disable-next-line func-names
    const func = function() {
      throw new ReferenceError(
        "This is a local-promise function and it should'nt be execute"
      );
    };

    func[kValue] = value;
    let promise;

    func.then = function then(onFulfilled, onRejected) {
      if (!promise) {
        promise = rejected
          ? Promise.reject(this[kValue])
          : Promise.resolve(this[kValue]);
      }

      return promise.then(onFulfilled, onRejected);
    };

    func.catch = function promiseCatch(onRejected) {
      return this.then(null, onRejected);
    };

    return new Proxy(func, {
      get(target, property) {
        if (property in target) return target[property];

        if (rejected) {
          return new LocalPromise(value, true);
        }

        try {
          return new LocalPromise(value[property]);
        } catch (error) {
          return new LocalPromise(error, true);
        }
      },

      apply(target, thisArg, argumentsList) {
        if (rejected) {
          return new LocalPromise(value, true);
        }

        try {
          return new LocalPromise(value.apply(thisArg, argumentsList));
        } catch (error) {
          return new LocalPromise(error, true);
        }
      },

      construct(target, argumentsList) {
        if (rejected) {
          return new LocalPromise(value, true);
        }

        try {
          // eslint-disable-next-line new-cap
          return new LocalPromise(new value(argumentsList));
        } catch (error) {
          return new LocalPromise(error, true);
        }
      },
    });
  }
}
