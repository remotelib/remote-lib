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
import createSockets from './utils/create-sockets';

const { describe, it } = global;

describe('utils', () => {
  describe('create-sockets', () => {
    it('should pass through data', done => {
      const sockets = createSockets();

      sockets[1].on('data', buf => sockets[1].write(`${buf.toString()}abc`));

      const run = [];
      sockets[0].on('data', buf => {
        assert.equal(buf.toString(), '123abc');

        run.push('data');
        sockets[0].destroy();
      });

      sockets[0].on('close', () => {
        run.push('close');
      });

      sockets[1].on('close', () => {
        assert.deepEqual(run, ['data', 'close']);
        done();
      });

      sockets[0].write('123');
    });

    it('should allow half open', done => {
      const sockets = createSockets();

      sockets[1].on('end', () => {
        sockets[0].on('data', buf => {
          assert.equal(buf.toString(), '123');
          done();
        });

        sockets[1].write('123');
      });

      sockets[0].end();
    });
  });
});
