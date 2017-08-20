[![view on npm](http://img.shields.io/npm/v/remote-lib.svg)](https://www.npmjs.org/package/remote-lib)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg)](https://david-dm.org/remotelib/remote-lib)
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

# API Reference
Remote-lib is build with many small sub-packages, each package implement a small part of this library. 

* [remote-lib](packages/remote-lib) - A high level API for creating remote libraries.
* [remote-context](packages/remote-context) - The core of `remote-lib`, creating and serving remote context.
* [remote-environment](packages/remote-environment) - A shared environment context with native objects such as `Object`, `Number`, `String`, etc...
* [remote-instance](packages/remote-instance) - A stream transformer that can parse and construct instance remotely.
* [remote-protocol](packages/remote-protocol) - The core of `remote-lib` protocol.
* [reference-context](packages/reference-context) - Virtual context implementation on vanilla Javascript.
  
<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
