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
import { Stream, PassThrough } from 'stream';
import Parser from '..';

const { describe, it } = global;

describe('Parser instance', () => {
  it('README Usage', () => {
    class Foo {
      constructor(bar) {
        this.bar = bar;
      }

      toArgumentsList() {
        return [this.bar];
      }
    }

    const parser = new Parser();
    parser.register(0x01, Foo);

    const foo = new Foo({ test: 'myThing' });
    const buffer = parser.encode(foo);

    const decodedFoo = parser.decode(buffer);

    assert.notEqual(decodedFoo, foo);
    assert.equal(decodedFoo instanceof Foo, true);

    assert.deepEqual(decodedFoo.bar, { test: 'myThing' });
  });

  describe('#constructor', () => {
    it('should create with no arguments', () => {
      const parser = new Parser();
      assert(parser instanceof Parser);
    });
  });

  describe('#register()', () => {
    it('should register a class with toArgumentsList() method', () => {
      class Foo {
        toArgumentsList() {
          return [this.foo];
        }
      }

      const parser = new Parser();
      assert.equal(parser.register(0x01, Foo), parser);
    });

    it("should'nt register an empty class", () => {
      class Empty {}

      const parser = new Parser();

      assert.throws(() => parser.register(0x01, Empty), TypeError);
    });

    it('should register multiple classes', () => {
      class Foo {
        toArgumentsList() {
          return [this.foo];
        }
      }

      class Bar {
        toArgumentsList() {
          return [this.bar];
        }
      }

      const parser = new Parser();

      parser.register({
        0x01: Foo,
        0x02: Bar,
        0x03: Foo,
      });
    });

    it('should fail on multiple empty classes', () => {
      class Empty {}

      const parser = new Parser();

      assert.throws(() => {
        parser.register({
          0x01: Empty,
          0x02: Empty,
        });
      }, TypeError);
    });
  });

  describe('#encode()', () => {
    it('should encode plain objects', () => {
      const parser = new Parser();
      const buffer = parser.encode({ foo: 'bar', soo: 123 });

      assert(buffer instanceof Buffer);
    });

    it('should encode custom instance', () => {
      class Foo {
        constructor(foo) {
          this.foo = foo;
        }

        toArgumentsList() {
          return [this.foo];
        }
      }

      const parser = new Parser();
      parser.register(0x01, Foo);

      const foo = new Foo({ test: 'myThing' });
      const buffer = parser.encode(foo);

      assert(buffer instanceof Buffer);
    });
  });

  describe('#decode()', () => {
    it('should decode plain objects', () => {
      const parser = new Parser();
      const obj = { foo: 'bar', soo: 123 };

      const buffer = parser.encode(obj);
      const decObj = parser.decode(Buffer.from(buffer));

      assert.notEqual(decObj, obj);
      assert.deepEqual(decObj, obj);
    });

    it('should decode custom instance', () => {
      class Foo {
        constructor(foo) {
          this.foo = foo;
        }

        toArgumentsList() {
          return [this.foo];
        }
      }

      const parser = new Parser();
      parser.register(0x01, Foo);

      const foo = new Foo({ test: 'myThing' });

      const buffer = parser.encode(foo);
      const copyFoo = parser.decode(Buffer.from(buffer));

      assert.notEqual(copyFoo, foo);
      assert.equal(Object.getPrototypeOf(copyFoo), Foo.prototype);
      assert.deepEqual(copyFoo.foo, foo.foo);
      assert.deepEqual(copyFoo, foo);
    });

    it('should decode custom instance with custom fromArgumentsList()', () => {
      class Foo {
        constructor(foo) {
          this.foo = foo;
        }

        toArgumentsList() {
          return [this.foo];
        }
      }

      class Bar {
        static fromArgumentsList(argumentsList) {
          return new Foo(...argumentsList);
        }

        constructor(bar) {
          this.bar = bar;
        }

        toArgumentsList() {
          return [this.bar];
        }
      }

      const parser = new Parser();
      parser.register(0x01, Foo);
      parser.register(0x02, Bar);

      const bar = new Bar({ test: 'myThing' });

      const buffer = parser.encode(bar);
      const foo = parser.decode(Buffer.from(buffer));

      assert.notEqual(foo, bar);
      assert.notDeepEqual(foo, bar);
      assert.equal(Object.getPrototypeOf(foo), Foo.prototype);
      assert.deepEqual(foo.foo, bar.bar);
    });
  });

  describe('#encoders()', () => {
    it('should return Transform stream', () => {
      const parser = new Parser();
      const stream = parser.encoder();

      assert(stream instanceof Stream);
      assert.equal(typeof stream.read, 'function');
      assert.equal(typeof stream.pipe, 'function');
      assert.equal(typeof stream.write, 'function');
    });

    // TODO add more tests
  });

  describe('#decoder()', () => {
    it('should return Transform stream', () => {
      const parser = new Parser();
      const stream = parser.decoder();

      assert(stream instanceof Stream);
      assert.equal(typeof stream.read, 'function');
      assert.equal(typeof stream.pipe, 'function');
      assert.equal(typeof stream.write, 'function');
    });

    // TODO add more tests
  });

  describe('#transform()', () => {
    class Foo {
      constructor(foo) {
        this.foo = foo;
      }

      toArgumentsList() {
        return [this.foo];
      }
    }

    it('should work with PassThrough', () => {
      const parser = new Parser();
      parser.register(0x01, Foo);

      const stream = new PassThrough();
      const objectStream = parser.transform(stream);

      const foo = new Foo('abc');
      objectStream.write(foo);

      objectStream.on('data', streamFoo => {
        assert.equal(Object.getPrototypeOf(streamFoo), Foo.prototype);
        assert.deepEqual(streamFoo, foo);
      });
    });

    // TODO add more tests
  });
});
