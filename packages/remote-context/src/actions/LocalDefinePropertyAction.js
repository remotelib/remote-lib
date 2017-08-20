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

export default class LocalDefinePropertyAction extends ReferencePropertyAction {
  static fromRemote(session, reference, property, descriptor) {
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
    const target = session.get(this.reference);

    if (!session.isWritable(target)) {
      throw new TypeError(
        `Can't define property of a read-only object: ${target}`
      );
    }

    const property = this.constructor.fetch(session, this.property);
    const descriptor = this.constructor.fetch(session, this.descriptor);

    return Reflect.defineProperty(target, property, descriptor);
  }

  exec(session) {
    this.fetch(session);
  }

  toArgumentsList() {
    return [this.reference, this.property, this.descriptor];
  }
}
