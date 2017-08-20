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
import { isConstructor, construct, trimArgumentsList } from '..';

const { describe, it } = global;

describe('helpers methods', () => {
  describe('#isConstructor()', () => {
    it('should failed on objects', () => {
      assert.equal(isConstructor({}), false);
    });

    it('should failed on null', () => {
      assert.equal(isConstructor(null), false);
    });

    it('should failed on undefined', () => {
      assert.equal(isConstructor(), false);
    });

    it('should failed on arrow function', () => {
      assert.equal(isConstructor(() => {}), false);
    });

    it('should failed on simple function', () => {
      function simple() {
        this.foo = 1;
      }

      assert.equal(isConstructor(simple), false);
    });

    it('should works on simple function with "toArgumentsList" method', () => {
      function simple() {
        this.foo = 1;
      }
      simple.prototype.toArgumentsList = () => [];

      assert.equal(isConstructor(simple), true);
    });

    it('should failed on empty class', () => {
      class Demo {}

      assert.equal(isConstructor(Demo), false);
    });

    it('should works on class with "toArgumentsList" method', () => {
      class Demo {
        toArgumentsList() {
          return [this.constructor.name];
        }
      }

      assert.equal(isConstructor(Demo), true);
    });
  });

  describe('#construct()', () => {
    class Foo {
      constructor(...args) {
        this.args = args;
      }
    }

    class FooBar {
      static fromArgumentsList(argumentsList) {
        return new Foo(...argumentsList);
      }
    }

    it('should create Foo with 2 arguments', () => {
      const arg1 = {};
      const arg2 = {};

      const foo = construct(Foo, [arg1, arg2]);

      assert.equal(typeof foo, 'object');
      assert(foo instanceof Foo);
      assert.equal(Object.getPrototypeOf(foo), Foo.prototype);

      assert.equal(foo.args.length, 2);
      assert.equal(foo.args[0], arg1);
      assert.equal(foo.args[1], arg2);
    });

    it('should use static function "construct"', () => {
      const arg1 = {};
      const arg2 = {};

      const foo = construct(FooBar, [arg1, arg2]);

      assert.equal(typeof foo, 'object');
      assert(foo instanceof Foo);
      assert.equal(Object.getPrototypeOf(foo), Foo.prototype);

      assert.equal(foo.args.length, 2);
      assert.equal(foo.args[0], arg1);
      assert.equal(foo.args[1], arg2);
    });
  });

  describe('#trimArgumentsList()', () => {
    it('should trim as describe on the docs', () => {
      const argumentsList = [1, 'foo', undefined, {}];
      const defaults = [undefined, 'foo', 'bar', {}];

      const trimmed = trimArgumentsList(argumentsList, defaults);

      assert(Array.isArray(trimmed));
      assert.deepEqual(trimmed, [1]);
    });

    it('should trim arguments with undefined defaults', () => {
      const argumentsList = ['foo', undefined, {}, 4];
      const defaults = [undefined, undefined, {}, 4];

      const trimmed = trimArgumentsList(argumentsList, defaults);

      assert(Array.isArray(trimmed));
      assert.deepEqual(trimmed, ['foo']);
    });

    it('should trim only undefined arguments', () => {
      const argumentsList = ['foo', null, undefined];
      const trimmed = trimArgumentsList(argumentsList);

      assert.deepEqual(trimmed, ['foo', null]);
    });
  });
});
