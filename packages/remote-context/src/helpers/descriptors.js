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

const kCachedValues = Symbol('_cachedValues');

// export function isCacheProperty(property) {
//   return property === kCachedValues;
// }

export function isDataDescriptor(descriptor) {
  return 'value' in descriptor || 'writable' in descriptor;
}

export function isAccessorDescriptor(descriptor) {
  return 'get' in descriptor || 'set' in descriptor;
}

export function equalValue(value1, value2) {
  return value1 === value2 || (isNaN(value1) && isNaN(value2));
}

export function equalDescriptors(desc1, desc2) {
  if (typeof desc1 !== 'object') {
    return desc1 === desc2;
  }

  return (
    typeof desc2 === 'object' &&
    equalValue(desc1.value, desc2.value) &&
    desc1.configurable === desc2.configurable &&
    desc1.writable === desc2.writable &&
    desc1.enumerable === desc2.enumerable &&
    desc1.get === desc2.get &&
    desc1.set === desc2.set
  );
}

export function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

export function getPropertyDescriptor(object, property) {
  let proto = object;

  do {
    const desc = Object.getOwnPropertyDescriptor(proto, property);
    if (desc !== undefined) return desc;

    proto = Object.getPrototypeOf(proto);
  } while (proto !== null);

  return undefined;
}

export function getOwnProperties(object) {
  return Object.getOwnPropertyNames(object).concat(
    Object.getOwnPropertySymbols(object)
  );
}

export const getOwnPropertyDescriptors =
  Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(object) {
    const descriptors = {};

    getOwnProperties(object).forEach(property => {
      descriptors[property] = Object.getOwnPropertyDescriptor(object, property);
    });

    return descriptors;
  };

function getCachePropertyDescriptors(object) {
  let proto = object;
  const descriptors = {};

  do {
    const properties = getOwnProperties(proto);

    // eslint-disable-next-line no-loop-func
    properties.forEach(property => {
      if (hasOwnProperty(descriptors, property)) return;

      descriptors[property] = Object.getOwnPropertyDescriptor(proto, property);
    });

    proto = Object.getPrototypeOf(proto);
  } while (
    proto !== Object.prototype && proto !== null && proto !== Function.prototype
  );

  return descriptors;
}

function isObjectCachable(object) {
  return !object.constructor || object.constructor.prototype !== object;
}

function isDescriptorCachable(property, descriptor) {
  return (
    isAccessorDescriptor(descriptor) &&
    typeof descriptor.get === 'function' &&
    typeof property === 'string' &&
    property[0] !== '_'
  );
}

export function cacheGetters(object) {
  if (!isObjectCachable(object)) return {};

  const descriptors = getCachePropertyDescriptors(object);
  const cache = {};

  Object.keys(descriptors).forEach(property => {
    const desc = descriptors[property];
    if (!isDescriptorCachable(property, desc)) return;

    try {
      cache[property] = desc.get.call(object); // assumes Function.prototype.call
    } catch (error) {
      // ignore getter errors
    }
  });

  return cache;
}

// export function setCachedGetters(object, cachedValues) {
//   object[kCachedValues] = cachedValues; // eslint-disable-line no-param-reassign
// }

export function setCachedGetter(object, property, cachedValue) {
  let cachedValues = object[kCachedValues];
  if (!cachedValues) {
    cachedValues = {};
    object[kCachedValues] = cachedValues; // eslint-disable-line no-param-reassign
  }

  cachedValues[property] = cachedValue;
}

export function getCachedGetter(object, property) {
  const cachedValues = object[kCachedValues];
  if (!cachedValues || !hasOwnProperty(cachedValues, property)) {
    throw new TypeError(
      `Couldn't find property cache for getter "${property}", ` +
        'please resolve this remote value again.'
    );
  }

  return cachedValues[property];
}

export function deleteCachedGetter(object, property) {
  const cachedValues = object[kCachedValues];
  if (!cachedValues) return;

  delete cachedValues[property];
}
