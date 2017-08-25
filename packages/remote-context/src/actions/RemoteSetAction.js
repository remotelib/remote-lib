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

import ReferenceAction from './ReferenceAction';

export default class RemoteSetAction extends ReferenceAction {
  static fromSnapshot(session, reference, snapshot) {
    const typeOf = typeof snapshot.value;
    const action = this.types[typeOf];

    if (!action) {
      throw new TypeError(`Set is not supported for type: ${typeOf}`);
    }

    return action.fromSnapshot(session, reference, snapshot);
  }

  createInstance(/* session */) {
    throw new TypeError(`createInstance is not implemented at ${this}`);
  }

  // eslint-disable-next-line class-methods-use-this
  populateInstance(/* session, instance */) {}

  fetch(session) {
    const instance = this.createInstance(session);
    session.remote.set(this.reference, instance);

    this.populateInstance(session, instance);
    return session.remote.get(this.reference);
  }

  delete(session) {
    return session.remote.delete(this.reference);
  }

  exec(session) {
    this.fetch(session);
  }
}

RemoteSetAction.types = {};
