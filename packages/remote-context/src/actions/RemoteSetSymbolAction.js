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

import { trimArgumentsList } from 'remote-instance';
import RemoteSetAction from './RemoteSetAction';

export default class RemoteSetSymbolAction extends RemoteSetAction {
  static fromValue(session, reference, symbol) {
    const key = Symbol.keyFor(symbol);
    if (key) return new this(reference, key, true);

    const name = symbol.toString().match(/^Symbol\((.+)\)$/);
    if (name) return new this(reference, name[1]);

    return new this(reference);
  }

  constructor(reference, name = null, isKey = false) {
    if (name !== null) {
      if (typeof name !== 'string') {
        throw new TypeError('Expected name to be a string or null');
      }
    } else if (isKey === true) {
      throw new TypeError(
        'Expected name to be a valid string when Symbol has a key',
      );
    }
    if (typeof isKey !== 'boolean') {
      throw new TypeError('Expected isKey to be boolean');
    }
    super(reference);

    this.name = name;
    this.isKey = isKey;
  }

  createInstance() {
    if (this.isKey) {
      return Symbol.for(this.name);
    }

    return Symbol(this.name || undefined);
  }

  toArgumentsList() {
    const argumentsList = [this.reference, this.name, this.isKey];
    const defaults = [undefined, null, false];

    return trimArgumentsList(argumentsList, defaults);
  }
}

RemoteSetAction.types.symbol = RemoteSetSymbolAction;
