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

// Many methods in this file inspire from the ES5 shim for ES6 Reflect and Proxy objects:
// {@link https://github.com/tvcutsem/harmony-reflect} (Apache-2.0 License)

import EventEmitter from 'events';
import RemoteSession from './RemoteSession';
import RemoteContext from './RemoteContext';
import {
  LocalDefinePropertyAction,
  LocalDeletePropertyAction,
  LocalSetPrototypeOfAction,
  LocalPreventExtensionsAction,
} from './actions';
import {
  getCachedGetter,
  getPropertyDescriptor,
  isDataDescriptor,
  isAccessorDescriptor,
} from './helpers/descriptors';

const kProxyData = Symbol('proxyData');
const kError = Symbol('error');

const proxyMap = new WeakMap();

/**
 * A remote value proxy returned from the {@link RemoteValue} constructor.
 * This proxy make possible to make changes to remote values and get the changes send to
 * the remote peer.
 *
 * @typedef {object|function} RemoteValueProxy
 */

/**
 * Remote value representation locally.
 * @example
 * import { RemoteValue } from 'remote-context';
 *
 * const proxy = new RemoteValue(remoteSession, reference, value);
 */
export default class RemoteValue extends EventEmitter {
  /**
   * Check if the give value is a proxy of remote value.
   *
   * @param {RemoteValueProxy|*} proxy The given value
   * @return {boolean}
   */
  static isRemoteValue(proxy) {
    return proxyMap.has(proxy);
  }

  /**
   * Get the remote value instance of the given proxy.
   *
   * @param {RemoteValueProxy} proxy The given proxy
   * @throws {ReferenceError} If the given value is not a {@link RemoteValueProxy}.
   * @return {RemoteValue}
   */
  static reveal(proxy) {
    const remoteValue = proxyMap.get(proxy);

    if (!remoteValue) {
      throw new ReferenceError(
        `The given value is not a RemoteValue proxy: ${proxy}`
      );
    }

    return remoteValue;
  }

  /**
   * Resolve the given value.
   * Reject the value if it's a {@link RemoteValueProxy} and an uncaught error accord while
   * using the value (ie. assign property to the value failed). Otherwise, resolve it.
   *
   * @param {RemoteValueProxy|*} value The given value
   * @return {Promise}
   */
  static resolve(value) {
    return new Promise((resolve, reject) => {
      const remoteValue = proxyMap.get(value);
      if (!remoteValue || !remoteValue[kError]) {
        resolve(value);
        return;
      }

      const error = remoteValue[kError];
      remoteValue[kError] = null;

      reject(error);
    });
  }

  /**
   * If the given value is a {@link RemoteValueProxy}, revoke the value proxy.
   * Otherwise, do nothing.
   *
   * @param {*} proxy The given value
   * @return {void}
   */
  static revoke(proxy) {
    const remoteValue = proxyMap.get(proxy);
    if (!remoteValue) return;

    remoteValue.revoke();
  }

  /**
   * Observe for any change on the given remote value proxy.
   *
   * @see {@link https://github.com/tc39/proposal-observable}
   * @param {RemoteValueProxy} proxy The given remove value proxy
   * @param {function|null} onNext Called on every change to the given value with the
   * {@link RemoteValueProxy} as the first argument
   * @param {function|null} onError Called on every error occurred on the given value with an
   * error as first argument
   * @param {function|null} onComplete Called when the given value revoked with no arguments
   * @return {{unsubscribe: (function()), closed: boolean}} An subscription object with
   * `unsubscribe` method to stop observer events from calling and a `closed` property.
   */
  static observe(proxy, onNext = null, onError = null, onComplete = null) {
    const remoteValue = RemoteValue.reveal(proxy);

    let subscription;
    const events = {
      change: onNext && (value => onNext(value)),
      error: onError,
      revoke: () => {
        subscription.closed = true;

        if (onComplete !== null) onComplete();
      },
    };

    subscription = {
      unsubscribe() {
        Object.keys(events).forEach(event => {
          const listener = events[event];
          if (!listener) return;

          remoteValue.removeListener(event, listener);
        });
      },
      closed: !remoteValue.target,
    };

    if (!subscription.closed) {
      Object.keys(events).forEach(event => {
        const listener = events[event];
        if (listener === null) return;

        remoteValue.on(event, listener);
      });
    }

    return subscription;
  }

  /**
   * Create a {@link RemoteValue} class and a proxy to the given value.
   *
   * @param {RemoteSession} session The current value remote session
   * @param {Reference} reference he value reference for further updates to the remote peer
   * @param {*} value The given value
   * @return {RemoteValueProxy} A proxy to the given value
   */
  constructor(session, reference, value) {
    if (!(session instanceof RemoteSession)) {
      throw new TypeError(
        `Expect session to be instance of RemoteSession: ${session}`
      );
    }
    if (!RemoteContext.isValidReference(reference)) {
      throw new TypeError(`The given reference is not valid: ${reference}`);
    }

    if (!(value instanceof Object)) {
      return value;
    }

    super();

    const self = this;
    this[kError] = null;

    this[kProxyData] = Proxy.revocable(value, {
      get(target, property) {
        const desc = getPropertyDescriptor(target, property);
        if (desc === undefined) return undefined;

        let val;
        if (isDataDescriptor(desc)) {
          val = desc.value;
        } else {
          const getter = desc.get;
          if (getter === undefined) {
            return undefined;
          }

          return getCachedGetter(target, property);
        }

        if (typeof val !== 'function' || !session.exists(val)) {
          return val;
        }

        const remoteContext = session.remote;
        if (!remoteContext.exists(val)) {
          return val;
        }

        return remoteContext.fetch(remoteContext.lookup(val));
      },

      set(target, property, val, receiver) {
        let desc = getPropertyDescriptor(target, property);
        if (desc === undefined) {
          desc = {
            value: undefined,
            writable: true,
            enumerable: true,
            configurable: true,
          };
        }

        if (isAccessorDescriptor(desc)) {
          const setter = desc.set;
          if (setter === undefined) return false;

          const ret = setter.call(receiver, val); // assumes Function.prototype.call

          if (RemoteValue.isRemoteValue(setter)) {
            ret.then(() => {});
          }

          return true;
        }

        if (desc.writable === false) return false;

        const existingDesc = Object.getOwnPropertyDescriptor(
          receiver,
          property
        );

        if (existingDesc) {
          Object.defineProperty(receiver, property, {
            value: val,
            writable: existingDesc.writable,
            enumerable: existingDesc.enumerable,
            configurable: existingDesc.configurable,
          });
          return true;
        }

        if (!Object.isExtensible(receiver)) return false;

        Object.defineProperty(receiver, property, {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        return true;
      },

      setPrototypeOf(target, prototype) {
        session.request(
          LocalSetPrototypeOfAction.fromRemote(session, reference, prototype),
          () => {},
          err => self.reject(err)
        );

        return true;
      },

      preventExtensions() {
        session.request(
          LocalPreventExtensionsAction.fromRemote(session, reference),
          () => {},
          err => self.reject(err)
        );

        return true;
      },

      defineProperty(target, property, descriptor) {
        session.request(
          LocalDefinePropertyAction.fromRemote(
            session,
            reference,
            property,
            descriptor
          ),
          () => {},
          err => self.reject(err)
        );

        return true;
      },

      deleteProperty(target, property) {
        session.request(
          LocalDeletePropertyAction.fromRemote(session, reference, property),
          () => {},
          err => self.reject(err)
        );

        return true;
      },
    });

    this[kProxyData].target = value;
    const { proxy } = this[kProxyData];

    proxyMap.set(proxy, this);
    return proxy;
  }

  get proxy() {
    return this[kProxyData].proxy;
  }

  get target() {
    return this[kProxyData].target;
  }

  reject(error) {
    if (!this[kError]) {
      this[kError] = error;
    }

    try {
      this.emit('error', error);
    } catch (err) {
      // Ignore throwing error if no listeners found
    }
  }

  revoke() {
    delete this[kProxyData].target;
    this[kProxyData].revoke();

    this.emit('revoke');
  }

  // Update methods

  setPrototypeOf(prototype) {
    const { target, proxy } = this[kProxyData];
    if (!target) return false;

    Object.setPrototypeOf(target, prototype);
    this.emit('change', proxy, 'setPrototypeOf');

    return true;
  }

  preventExtensions() {
    const { target, proxy } = this[kProxyData];
    if (!target) return false;

    Object.preventExtensions(target);
    this.emit('change', proxy, 'preventExtensions');

    return true;
  }

  defineProperty(property, descriptor) {
    const { target, proxy } = this[kProxyData];
    if (!target) return false;

    Object.defineProperty(target, property, descriptor);
    this.emit('change', proxy, 'defineProperty', property);

    return true;
  }

  deleteProperty(property) {
    const { target, proxy } = this[kProxyData];
    if (!target) return false;

    Object.deleteProperty(target, property);
    this.emit('change', proxy, 'deleteProperty', property);

    return true;
  }
}

/**
 * @type {RemoteValue.isRemoteValue}
 */
export const isRemoteValue = RemoteValue.isRemoteValue;

/**
 * @type {RemoteValue.reveal}
 */
export const reveal = RemoteValue.reveal;

/**
 * @type {RemoteValue.revoke}
 */
export const revoke = RemoteValue.revoke;

/**
 * @type {RemoteValue.observe}
 */
export const observe = RemoteValue.observe;
