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

/* eslint-disable prettier/prettier */

import es6Array from './Array';
import es6ArrayBuffer from './ArrayBuffer';
import es6Boolean from './Boolean';
import es6DataView from './DataView';
import es6Date from './Date';
import es6Error from './Error';
import es6EvalError from './EvalError';
import es6Float32Array from './Float32Array';
import es6Float64Array from './Float64Array';
import es6Function from './Function';
// import es6GeneratorFunction from './GeneratorFunction';
import es6Int8Array from './Int8Array';
import es6Int16Array from './Int16Array';
import es6Int32Array from './Int32Array';
import es6Intl from './Intl';
import es6JSON from './JSON';
import es6Map from './Map';
import es6Math from './Math';
import es6Number from './Number';
import es6Object from './Object';
import es6Promise from './Promise';
import es6Proxy from './Proxy';
import es6RangeError from './RangeError';
import es6ReferenceError from './ReferenceError';
import es6Reflect from './Reflect';
import es6RegExp from './RegExp';
import es6Set from './Set';
import es6String from './String';
import es6Symbol from './Symbol';
import es6SyntaxError from './SyntaxError';
import es6TypeError from './TypeError';
import es6Uint8Array from './Uint8Array';
import es6Uint8ClampedArray from './Uint8ClampedArray';
import es6Uint16Array from './Uint16Array';
import es6Uint32Array from './Uint32Array';
import es6URIError from './URIError';
import es6WeakMap from './WeakMap';
import es6WeakSet from './WeakSet';

export default Object.assign({},
  es6Array,
  es6ArrayBuffer,
  es6Boolean,
  es6DataView,
  es6Date,
  es6Error,
  es6EvalError,
  es6Float32Array,
  es6Float64Array,
  es6Function,
  // es6GeneratorFunction,  // TODO add support for GeneratorFunction (babel problem)
  es6Int8Array,
  es6Int16Array,
  es6Int32Array,
  es6Intl,
  es6JSON,
  es6Map,
  es6Math,
  es6Number,
  es6Object,
  es6Promise,
  es6Proxy,
  es6RangeError,
  es6ReferenceError,
  es6Reflect,
  es6RegExp,
  es6Set,
  es6String,
  es6Symbol,
  es6SyntaxError,
  es6TypeError,
  es6Uint8Array,
  es6Uint8ClampedArray,
  es6Uint16Array,
  es6Uint32Array,
  es6URIError,
  es6WeakMap,
  es6WeakSet,
  {
    'decodeURI': decodeURI,
    'decodeURIComponent': decodeURIComponent,
    'encodeURI': encodeURI,
    'encodeURIComponent': encodeURIComponent,
    'escape': escape,
    'isFinite': isFinite,
    'isNaN': isNaN,
    'unescape': unescape,
  },
);
