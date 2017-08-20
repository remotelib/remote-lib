[![view on npm](http://img.shields.io/npm/v/remote-lib.svg)](https://www.npmjs.org/package/remote-lib)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/remote-lib)](https://david-dm.org/remotelib/remote-lib?path=packages/remote-lib)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/remote-lib.svg)](LICENSE)

# Remote-lib
Create a library and share it remotely with other peers via **ANY** stream object 💫.

Using only a [Duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) such as 
[TCP soocket](https://nodejs.org/api/net.html#net_net_createconnection_options_connectlistener), 
[WebSocket](https://www.npmj.com/package/websocket-stream) or even 
[WebRTC DataChannel](https://www.npmjs.com/package/simple-peer) with this library you can just share
your code with other peers without worrying for API interfaces or RPC integration. Your users 
will be able to use your code remotely exactly as you write it. Including calling functions with 
callbacks, Promises, class inheritance and more.

This library is based on the [remote-context](https://www.npmjs.org/package/remote-context) module.

## Install
```
npm install remote-lib
```

## Usage
### On the server
```js
const net = require('net');
const { Library } = require('remote-lib');

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
      setTimeout(() => resolve({ data: 'Tada!' }), 100),
    ),

  // Classes and objects
  myThings: new Set(['car', 'keys', 'pizza']),
});

// Create a server and serve each client the context remotely
const server = net.createServer(socket => {
  library.serve(socket);
});

// Bind on port 3000
server.listen(3000);
```

### On the client
```js
const net = require('net');
const { RemoteLibrary } = require('remote-lib');

// Connect to the server and get a stream
const socket = net.createConnection(3000);

// Create the remote library
const remoteLibrary = new RemoteLibrary(socket);

// Get the remote "foo"
remoteLibrary.foo.then(value => {
  // value === 'bar'
});

// Run the remote function "getRandom"
remoteLibrary.getRandom().then(value => {
  // `value` is random number
});

// Run the remote async function "getData"
remoteLibrary.getData().then(value => {
  // value === { data: 'Tada!' }
});

// Get remote instance set "myThings"
remoteLibrary.myThings.then(async set => {
  set instanceof Set; // true

  // All instance methods require await or #then() when calling
  await set.has('keys'); // true
  await set.has('cat'); // false

  // Change the remote instance
  await set.add('dog');
  await set.has('dog'); // true
});
```


## API Reference

This module is a part of the [`remote-lib`](https://github.com/remotelib/remote-lib) library.

Here is the relevant documentation for this module:

- [`Library`](https://remotelib.github.io/remote-lib/class/packages/remote-lib/src/Library.js~Library.html)
- [`RemoteLibrary`](https://remotelib.github.io/remote-lib/class/packages/remote-lib/src/RemoteLibrary.js~RemoteLibrary.html)


<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
