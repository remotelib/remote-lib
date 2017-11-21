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
import createStream from './utils/create-sockets';
import { Context, EnvContext } from '..';
import envContext from '../envs/es6-unstable';

const { describe, it } = global;

process.on('unhandledRejection', reason => {
  console.error(reason.stack || reason.message);
  process.exit(1);
});

describe('RemoteContext', () => {
  it('README Usage', done => {
    // Create a new context under ES6 environment.
    // You can put any object, class or instance under the context and it will be proxied to the
    // remote peer automatically
    const context = new Context(envContext, {
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
    });

    // Create a server and serve each client the context remotely
    const server = net.createServer(socket => {
      context.remote(socket);
    });

    // Bind on port 3000
    server.listen(3000, () => {
      let tests = 4;

      // Connect to the server and get a stream
      const socket = net.createConnection(3000);

      // Create the remote context
      const clientContext = new Context(envContext);
      const remoteContext = clientContext.remote(socket);

      remoteContext.on('close', () => {
        assert.equal(tests, 0);
        server.close();
        done();
      });

      // Get the remote "foo"
      remoteContext
        .fetch('foo')
        .then(value => {
          assert.equal(value, 'bar');

          tests -= 1;
          if (!tests) remoteContext.destroy();
        })
        .catch(done);

      // Run the remote function "getRandom"
      remoteContext
        .fetch('getRandom')()
        .then(value => {
          assert.equal(typeof value, 'number');
          assert(value < 1);
          assert(value >= 0);

          tests -= 1;
          if (!tests) remoteContext.destroy();
        })
        .catch(done);

      // Run the remote async function "getData"
      remoteContext
        .fetch('getData')()
        .then(value => {
          assert.deepEqual(value, { data: 'Tada!' });

          tests -= 1;
          if (!tests) remoteContext.destroy();
        })
        .catch(done);

      // Get remote instance set "myThings"
      remoteContext
        .fetch('myThings')
        .then(async set => {
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
          if (!tests) remoteContext.destroy();
        })
        .catch(done);
    });
  });

  describe('#remote()', () => {
    class Foo {
      constructor() {
        this.self = this;
      }

      // eslint-disable-next-line class-methods-use-this
      bar(res = 'hi!') {
        return res;
      }
    }

    Foo.prototype.Math = Math;

    it('should close when peer close', done => {
      const server = new Context(envContext, { foo: new Foo() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      const serverRemote = server.remote(streams[1]);

      let run = false;
      serverRemote.on('close', () => {
        assert(run);
        done();
      });

      setTimeout(() => {
        run = true;
        clientRemote.destroy();
      }, 20);
    });

    it('should call functions remotely', done => {
      const server = new Context(envContext, { foo: new Foo() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('foo')
        .then(obj => {
          assert.equal(typeof obj, 'object');
          assert.notEqual(obj, server.get('foo'));

          assert.equal(obj.self, obj);
          assert.equal(typeof obj.bar, 'function');
          assert.equal(obj.Math, Math);

          const promise = obj.bar();
          assert.equal(typeof promise, 'function');
          assert.equal(typeof promise.then, 'function');

          promise.then(value => {
            assert.equal(value, 'hi!');

            clientRemote.destroy();
            done();
          }, done);
        })
        .catch(done);
    });

    it('should work with empty envContext', done => {
      const server = new Context(new EnvContext('empty', {}), {
        foo: new Foo(),
      });
      const client = new Context(new EnvContext('empty', {}));

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('foo')
        .then(obj => {
          assert.equal(typeof obj, 'object');
          assert.notEqual(obj, server.get('foo'));

          assert.equal(obj.self, obj);
          assert.equal(typeof obj.bar, 'function');

          assert.notEqual(obj.Math, Math);
          assert.equal(typeof obj.Math.abs, 'function');
          assert.notEqual(obj.Math.abs, Math.abs);
          assert.equal(typeof obj.Math.min, 'function');
          assert.notEqual(obj.Math.min, Math.min);

          const promise = obj.bar();
          assert.equal(typeof promise, 'function');
          assert.equal(typeof promise.then, 'function');

          promise.then(value => {
            assert.equal(value, 'hi!');

            clientRemote.destroy();
            done();
          }, done);
        })
        .catch(done);
    });

    it('should protect read-only context', done => {
      const server = new Context(envContext, { foo: new Foo() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('foo')
        .then(obj => {
          // eslint-disable-next-line no-param-reassign
          obj.jjj = '123';

          return clientRemote.resolve(obj).then(
            () => done(new Error("Should't resolved")),
            err => {
              if (!(err instanceof TypeError)) {
                done(err);
                return;
              }

              assert.equal(
                err.message,
                "Can't define property of a read-only object: [object Object]"
              );

              clientRemote.destroy();
              done();
            }
          );
        })
        .catch(done);
    });

    it('should change writable context', done => {
      const server = new Context(envContext, { foo: new Foo() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1], {
        writable: true,
      });

      clientRemote
        .fetch('foo')
        .then(obj => {
          // eslint-disable-next-line no-param-reassign
          obj.jjj = '123';
          assert.equal(obj.jjj, undefined);

          return clientRemote.resolve(obj).then(value => {
            assert.equal(value, obj);
            assert.equal(obj.jjj, '123');

            clientRemote.destroy();
            done();
          });
        })
        .catch(done);
    });

    it('should call sub-functions remotely via promise', done => {
      const server = new Context(envContext, { foo: new Foo() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      const paramObj = {};

      clientRemote
        .fetch('foo')
        .bar(paramObj)
        .then(obj => {
          assert.equal(obj, paramObj);

          clientRemote.destroy();
          done();
        })
        .catch(done);
    });

    it('should work with promises', done => {
      const server = new Context(envContext, { promise: Promise.resolve(123) });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('promise')
        .then(obj => {
          assert.equal(obj, 123);

          return 'foo';
        })
        .then(value => {
          assert.equal(value, 'foo');

          clientRemote.destroy();
          done();
        })
        .catch(done);
    });

    it('should handle promise reject', done => {
      const server = new Context(envContext, { promise: Promise.reject(123) });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('promise')
        .then(() => {
          done(new Error('Should resolved'));
        })
        .catch(err => {
          assert.equal(err, 123);

          clientRemote.destroy();
          done();
        })
        .catch(done);
    });

    it('should handle promise then throws', done => {
      const server = new Context(envContext, { foo: 123 });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('foo')
        .then(value => {
          assert.equal(value, 123);

          throw new Error('should catch');
        })
        .catch(err => {
          assert.equal(err.message, 'should catch');

          clientRemote.destroy();
          done();
        });
    });

    it('should cache getters', done => {
      class TestGetter {
        constructor() {
          this.i = 0;
        }

        get getter() {
          this.i += 1;
          return this.i;
        }
      }

      const server = new Context(envContext, { test: new TestGetter() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('test')
        .then(test => {
          assert.equal(typeof test, 'object');

          const proto = Object.getPrototypeOf(test);
          const desc = Object.getOwnPropertyDescriptor(proto, 'getter');

          assert.equal(typeof desc, 'object');
          assert.equal(typeof desc.value, 'undefined');
          assert.equal(desc.configurable, true);
          assert.equal(typeof desc.writable, 'undefined');
          assert.equal(desc.enumerable, false);
          assert.equal(typeof desc.get, 'function');
          assert.equal(typeof desc.set, 'undefined');

          // validate getter is cached and use only once
          assert.equal(test.i, 1);
          assert.equal(test.getter, 1);
          assert.equal(test.i, 1);

          return clientRemote.resolve(test).then(resolvedTest => {
            assert.equal(resolvedTest.i, 2);
            assert.equal(resolvedTest.getter, 2);

            assert.equal(test.i, 2);
            assert.equal(test.getter, 2);

            clientRemote.destroy();
            done();
          });
        })
        .catch(done);
    });

    it('should use native setters', done => {
      class TestSetter {
        constructor() {
          this.i = 0;
        }

        set setter(i) {
          this.i = i;
        }
      }

      const server = new Context(envContext, { test: new TestSetter() });
      const client = new Context(envContext);

      const streams = createStream();
      const clientRemote = client.remote(streams[0]);
      server.remote(streams[1]);

      clientRemote
        .fetch('test')
        .then(test => {
          assert.equal(typeof test, 'object');

          const proto = Object.getPrototypeOf(test);
          const desc = Object.getOwnPropertyDescriptor(proto, 'setter');

          assert.equal(typeof desc, 'object');
          assert.equal(typeof desc.value, 'undefined');
          assert.equal(desc.configurable, true);
          assert.equal(typeof desc.writable, 'undefined');
          assert.equal(desc.enumerable, false);
          assert.equal(typeof desc.get, 'undefined');
          assert.equal(typeof desc.set, 'function');

          assert.equal(test.i, 0);
          assert.equal((test.setter = 1), 1); // eslint-disable-line no-param-reassign
          assert.equal(test.i, 0);

          return clientRemote.resolve(test).then(resolvedTest => {
            assert.equal(resolvedTest.i, 1);
            assert.equal(test.i, 1);

            clientRemote.destroy();
            done();
          });
        })
        .catch(done);
    });
  });
});
