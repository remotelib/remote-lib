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
import ReferenceAction from './ReferenceAction';

export default class LocalSetPrototypeOfAction extends ReferenceAction {
  static fromRemote(session, reference, prototype) {
    return new this(reference, session.dispatch(prototype));
  }

  constructor(reference, prototype = null) {
    if (prototype !== null && !(prototype instanceof ReferenceAction)) {
      throw new TypeError(`Invalid prototype: ${prototype}`);
    }
    super(reference);

    this.prototype = prototype;
  }

  fetch(session) {
    const target = session.get(this.reference);

    if (!session.isWritable(target)) {
      throw new TypeError(
        `Can't set prototype of a read-only object: ${target}`,
      );
    }

    const prototype = this.constructor.fetch(session, this.prototype);

    return Reflect.setPrototypeOf(target, prototype);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    const argumentsList = [this.reference, this.prototype];
    const defaults = [undefined, null];

    return trimArgumentsList(argumentsList, defaults);
  }
}
