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

import assert from 'assert';
import ReferenceContext from '..';

const { describe /* , it */ } = global;

describe('ReferenceContext', () => {
  it('README Usage', () => {
    class Foo {}
    const foo = new Foo();

    const parent = new ReferenceContext({ Object });
    const referenceContext = new ReferenceContext({ foo }, parent);

    assert.equal(parent.count, 1);
    assert.equal(referenceContext.count, 2);
    assert.equal(referenceContext.ownCount, 1);

    assert.equal(referenceContext.has('Object'), true);
    assert.equal(referenceContext.hasOwnReference('Object'), false);
    assert.equal(referenceContext.hasOwnReference('foo'), true);

    assert.equal(referenceContext.exists(Object), true);
    assert.equal(referenceContext.own(Object), false);

    assert.equal(referenceContext.get('Object'), Object);
    assert.equal(referenceContext.get('foo'), foo);

    assert.equal(referenceContext.lookup(Object), 'Object');
    assert.equal(referenceContext.lookup(foo), 'foo');
  });

  // TODO add tests
});
