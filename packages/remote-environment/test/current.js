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

let current = {};
const { describe, it } = global;

function isValid(value) {
  switch (typeof value) {
    case 'function':
    case 'symbol':
      return true;

    case 'object':
      return value !== null;

    default:
      return false;
  }
}

describe('remote-environment current', () => {
  it('should load nicely', () => {
    current = require('..').default; // eslint-disable-line global-require
    assert(Object.keys(current).length);
  });

  it('should have no only valid values', () => {
    Object.keys(current).forEach(key => {
      assert.equal(isValid(current[key]), true, key);
    });
  });

  it('should have "Object" key', () => {
    assert.equal(current.Object, Object);
  });

  it('should have "String" key', () => {
    assert.equal(current.String, String);
  });

  it('should have "Math" key', () => {
    assert.equal(current.Math, Math);
  });

  it('should have "String.prototype.indexOf" key', () => {
    assert.equal(current['String.prototype.indexOf'], String.prototype.indexOf);
  });
});
