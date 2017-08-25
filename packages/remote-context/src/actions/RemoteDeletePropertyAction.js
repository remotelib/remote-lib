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

import ReferencePropertyAction from './ReferencePropertyAction';
import { deleteCachedGetter } from '../helpers/descriptors';

export default class RemoteDeletePropertyAction extends ReferencePropertyAction {
  static fromLocal(session, reference, property) {
    return this.fromProperty(session, reference, property);
  }

  fetch(session) {
    const target = session.remote.getTarget(this.reference);
    const property = session.fetch(this.property);

    deleteCachedGetter(target.target, property);

    return target.deleteProperty(property);
  }

  exec(session) {
    this.fetch(session);
  }
}
