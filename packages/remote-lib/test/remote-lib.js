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
import net from 'net';
import { Library, RemoteLibrary } from '..';

const { describe, it } = global;

describe('RemoteContext', () => {
  it('README Usage', done => {
    // You can put any object, class or instance under the context and it will be proxied to the
    // remote peer automatically
    const library = new Library({
      // Static vars
      foo: 'bar',

      // Dynamic functions
      getRandom: () => Math.random(),

      // Async functions
      getData: () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: 'Tada!' }), 100)
        ),

      // Classes and objects
      myThings: new Set(['car', 'keys', 'pizza']),

      // Functions that return functions
      multiFunc: () => () => 'Yes!',
    });

    // Create a server and serve each client the context remotely
    const server = net.createServer(socket => {
      library.serve(socket);
    });

    // Bind on port 3000
    server.listen(3000, () => {
      let tests = 5;

      // Connect to the server and get a stream
      const socket = net.createConnection(3000);

      // Create the remote library
      const remoteLibrary = new RemoteLibrary(socket);

      remoteLibrary.on('close', () => {
        assert.equal(tests, 0);
        server.close();
        done();
      });

      // Get the remote "foo"
      remoteLibrary.foo.then(value => {
        assert.equal(value, 'bar');

        tests -= 1;
        if (!tests) remoteLibrary.destroy();
      }, done);

      // Run the remote function "getRandom"
      remoteLibrary.getRandom().then(value => {
        assert.equal(typeof value, 'number');
        assert(value < 1);
        assert(value >= 0);

        tests -= 1;
        if (!tests) remoteLibrary.destroy();
      }, done);

      // Run the remote async function "getData"
      remoteLibrary.getData().then(value => {
        assert.deepEqual(value, { data: 'Tada!' });

        tests -= 1;
        if (!tests) remoteLibrary.destroy();
      }, done);

      // Get remote instance set "myThings"
      remoteLibrary.myThings.then(async set => {
        assert.equal(set instanceof Set, true);

        // Access getters and data properties instantly
        assert.equal(set.size, 3);

        // Call methods with async promises
        assert.equal(await set.has('keys'), true);
        assert.equal(await set.has('cat'), false);

        // Change the remote instance
        await set.add('dog');
        assert.equal(await set.has('dog'), true);

        tests -= 1;
        if (!tests) remoteLibrary.destroy();
      }, done);

      // Use RemotePromise virtual path:
      remoteLibrary
        .multiFunc()()
        .then(value => {
          assert.equal(value, 'Yes!');

          tests -= 1;
          if (!tests) remoteLibrary.destroy();
        });
    });
  });
});
