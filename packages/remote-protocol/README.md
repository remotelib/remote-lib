[![view on npm](http://img.shields.io/npm/v/remote-protocol.svg)](https://www.npmjs.org/package/remote-protocol)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/remote-protocol)](https://david-dm.org/remotelib/remote-lib?path=packages/remote-protocol)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/remote-protocol.svg)](LICENSE)

# Remote-protocol
Enable peer to create session with other peer and executing actions remotely 💫. 

To create a session you should supply an duplex stream with `objectMode` turn on. See the 
[`remote-instance`](https://www.npmjs.org/package/remote-instance) module for a possible 
implementation.

All the communication between the peers handled by actions. An `Action` is simple class with a 
`fetch` and / or `exec` methods that the peers can use. The protocol has build-in support for 
requests and responses in order to fetch actions remotely.

## Install
```
npm install remote-protocol
```

## Usage
```js
const { Session, Action } = require('remote-protocol');

class FooAction extends Action {
  fetch() {
    return Math.random();
  }
}

// create an object mode stream that's bind to itself as-if other peer send the object
const objectStream = new PassThrough({ objectMode: true });

// create a session
const session = new Session(objectStream);

session.request(
  new FooAction(),
  result => {
    // `result` is random number
  },
  error => {
    // handle request error
  },
);
```  

## API Reference

This module is a part of the [`remote-lib`](https://github.com/remotelib/remote-lib) library.

Here is the relevant documentation for this module:

- [`Session`](https://remotelib.github.io/remote-lib/class/packages/remote-protocol/src/Session.js~Session.html)
- [`Action`](https://remotelib.github.io/remote-lib/class/packages/remote-protocol/src/actions/Action.js~Action.html)
  - [`RequestAction`](https://remotelib.github.io/remote-lib/class/packages/remote-protocol/src/actions/RequestAction.js~RequestAction.html)
  - [`RequestAction`](https://remotelib.github.io/remote-lib/class/packages/remote-protocol/src/actions/ResponseAction.js~ResponseAction.html)


<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
