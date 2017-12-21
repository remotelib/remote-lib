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
import PropertyDescriptorAction from './PropertyDescriptorAction';
import { deleteCachedGetter } from '../helpers/descriptors';

export default class RemoteDefinePropertyAction extends ReferencePropertyAction {
  static fromLocal(session, reference, property, descriptor) {
    return new this(
      reference,
      session.dispatch(property),
      PropertyDescriptorAction.fromPropertyDescriptor(session, descriptor)
    );
  }

  constructor(reference, property, descriptor) {
    if (!(descriptor instanceof PropertyDescriptorAction)) {
      throw new TypeError(
        `Expect descriptor to be instance of PropertyDescriptorAction: ${descriptor}`
      );
    }
    super(reference, property);

    this.descriptor = descriptor;
  }

  fetch(session) {
    const target = session.remote.getTarget(this.reference);

    const property = session.fetch(this.property);
    const descriptor = session.fetch(this.descriptor);

    deleteCachedGetter(target.target, property);

    return target.defineProperty(property, descriptor);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    return [this.reference, this.property, this.descriptor];
  }
}
