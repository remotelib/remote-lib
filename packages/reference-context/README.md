[![view on npm](http://img.shields.io/npm/v/reference-context.svg)](https://www.npmjs.org/package/reference-context)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/reference-context)](https://david-dm.org/remotelib/remote-lib?path=packages/reference-context)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/reference-context.svg)](LICENSE)

# Reference-context
Creates a virtual context that can hold values with given references 💫.

**Reference-context** allows you to lookup values on the context, get the number of references or
values currently on the context and even assign a new unique reference to a given value.
 
This library is the core context of the libraries 
[remote-lib](https://www.npmjs.org/package/remote-lib) and 
[remote-context](https://www.npmjs.org/package/remote-context).

## Install
```
npm install reference-context
```

## Usage
```js
const ReferenceContext = require('reference-context');

class Foo {}
const foo = new Foo();

const parent = new ReferenceContext({ Object });
const referenceContext = new ReferenceContext({ foo }, parent);

parent.count; // 1
referenceContext.count; // 2
referenceContext.ownCount; // 1

referenceContext.has('Object'); // true
referenceContext.hasOwnReference('Object'); // false
referenceContext.hasOwnReference('foo'); // true

referenceContext.exists(Object); // true
referenceContext.own(Object); // false

referenceContext.get('Object'); // Object
referenceContext.get('foo'); // foo

referenceContext.lookup(Object); // "Object"
referenceContext.lookup(foo); // "foo"
```  
 
## API Reference

This module is a part of the [`remote-lib`](http://www.remotelib.com) library.

Here is the relevant documentation for this module:

- [`ReferenceContext`](http://www.remotelib.com/class/packages/reference-context/src/reference-context.js~ReferenceContext.html)


<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
