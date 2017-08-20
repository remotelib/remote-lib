[![view on npm](http://img.shields.io/npm/v/remote-instance.svg)](https://www.npmjs.org/package/remote-instance)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/remote-instance)](https://david-dm.org/remotelib/remote-lib?path=packages/remote-instance)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/remote-instance.svg)](LICENSE)

# Remote-instance
With this library you can encode and transfer instances remotely 💫.

Remote instances will be just like if they created locally.
To create a remote instance all you need to do is:

1. **Optional** - Implement a _static_ method `fromArgumentsList()` on the constructor of the 
instance. This method will receive an array of arguments as first argument and should return 
a new instance accordingly. If this method those not exists, the arguments will apply on the 
instance constrictor (see [example](#usage) bellow).
2. Implement a method `toArgumentsList()` on the instance which return array of arguments of any 
kind (including other instances!) to recreate this instance remotely via the `fromArgumentsList()` 
method.
3. Register the instance constructor on the parser with a unique single byte-code that is well known
to each peer (see [example](#usage) bellow).

That's it!

You can use the parser method `parser.transform(stream)` to convert a duplex buffer stream to an 
object 
mode stream transformed by the parser (see [API Reference](#api-reference) for more details).   


## Install
```
npm install remote-instance
```

## Usage
```js
const Parser = require('remote-instance');

// Create test class
class Foo {
  constructor(bar) {
    this.bar = bar;
  }

  // Tel the parser how to rebuild this class remotely
  toArgumentsList() {
    return [this.bar];
  }
}

// Create a parser instance and register our class
const parser = new Parser();
parser.register(0x01, Foo);

// create an instance and encode it
const foo = new Foo({ test: 'myThing' });
const buffer = parser.encode(foo);

// decode and recreate the instance
const decodedFoo = parser.decode(buffer);

// `decodedFoo` is not foo but an exact copy of Foo
decodedFoo !== foo; // true
decodedFoo instanceof Foo; // true
decodedFoo.bar; // { test: 'myThing' }
```  
 
## API Reference

This module is a part of the [`remote-lib`](https://github.com/remotelib/remote-lib) library.

Here is the relevant documentation for this module:

- [`Parser`](https://remotelib.github.io/remote-lib/class/packages/remote-instance/src/parser.js~Parser.html)


<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
