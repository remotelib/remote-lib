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
import { PassThrough } from 'stream';
import { Session, Action } from '..';

const { describe, it } = global;

describe('Session', () => {
  it('README Usage', done => {
    class FooAction extends Action {
      // eslint-disable-next-line class-methods-use-this
      fetch() {
        return Math.random();
      }
    }

    // create an object mode stream that's bind to itself as it other peer send the object
    const objectStream = new PassThrough({ objectMode: true });
    const session = new Session(objectStream);

    session.request(
      new FooAction(),
      result => {
        assert.equal(typeof result, 'number');
        assert(result >= 0);
        assert(result < 1);

        done();
      },
      done,
    );
  });
});
