<h1 align="center">
  <br>
  <a href="http://www.remotelib.com"><img src="https://github.com/remotelib/remote-lib/raw/master/manual/asset/icon.png?docs-hack=.svg" alt="RemoteLib" width="200"></a>
  <br>
  RemoteLib
  <br>
  <br>
</h1>

<h4 align="center">Run remote JavaScript code as if it's your own local library.</h4>

<p align="center">
<a href="https://www.npmjs.org/package/remote-lib"><img src="http://img.shields.io/npm/v/remote-lib.svg" alt="View On NPM"></a>
<a href="https://travis-ci.org/remotelib/remote-lib"><img src="https://travis-ci.org/remotelib/remote-lib.svg?branch=master" alt="Build Status"></a>
<a href="https://david-dm.org/remotelib/remote-lib"><img src="https://david-dm.org/remotelib/remote-lib.svg" alt="Dependency Status"></a>
<a href="https://codecov.io/gh/remotelib/remote-lib"><img src="https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg" alt="codecov"></a>
<a href="LICENSE"><img src="https://img.shields.io/npm/l/remote-lib.svg" alt="License"></a>
</p>
<br>

**RemoteLib** is a library that can be shared remotely with other peers without worrying for API 
interfaces or RPC integration. Using only a 
[Duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex), such as 
[TCP socket](https://nodejs.org/api/net.html#net_net_createconnection_options_connectlistener), 
[WebSocket](https://www.npmjs.com/package/websocket-stream) or even 
[WebRTC DataChannel](https://www.npmjs.com/package/simple-peer), your users 
will be able to use your code remotely exactly as if it's local library. This, including calling 
functions with callbacks, 
[Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise), 
class inheritance, getters and setters support and more. See [usage](#usage) for some examples.

### Features

- **Use RemoteLib on node.js & on the browser** (just use [browserify](http://browserify.org) or
 [webpack](https://webpack.js.org/) to create a bundle).
- **Pure Javascript** (Using 
[ES6 Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy)).
- **Seamless interface** (your library will be proxies AS IS to the users remotely!). 
- **Proxy anything** - from functions and object, to classes and Promises and even 
[Symbols](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Symbol)!
- **Builtin support for Promises** - Resolve any path on the remote object via the `RemoteProxy` 
interface.
- **Builtin support for class inheritance** - Your user can use `instanceof` with the proxyied 
objects.
- **Use any communication method** - connect using simple `Stream` interface 
([WebSocket](https://www.npmjs.com/package/websocket-stream) or 
[WebRTC](https://www.npmjs.com/package/simple-peer) implementation available).
- Serve **multiple peers** in parallel.
- Use RemoteLib for **P2P projects** (via the [`remote-context`](packages/remote-context) library). 

### Install
```
npm install remote-lib
```

### Ways to help
* **Join us in [Gitter](https://gitter.im/remotelib/Lobby)** to help with development or to hang out with some mad science hackers :)
* **[Create a new issue](https://github.com/remotelib/remote-lib/issues/new)** to report bugs
* **[Fix an issue](https://github.com/remotelib/remote-lib/issues?state=open)**. RemoteLib is an OPEN Open Source Project!

### API Documentation

**[See the API Reference bellow](#api-reference)**.


### Usage
In this example we will create a demo library on a TCP server and then serve and use in on the 
client. Notice that the server and the client sharing only a Duplex tcp stream. You can replace it
easily with [WebSocket](https://www.npmjs.com/package/websocket-stream) or even 
[WebRTC DataChannel](https://www.npmjs.com/package/simple-peer).

#### Create a library on the server
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
  
  // Functions that return functions
  multiFunc: () => () => 'Yes!',
});

// Create a server and serve each client the context remotely
const server = net.createServer(socket => {
  library.serve(socket);
});

// Bind on port 3000
server.listen(3000);
```

#### Use the library remotely on the client
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
  
  // Access getters and data properties instantly
  set.size; // 3

  // Call methods with async promises
  await set.has('keys'); // true
  await set.has('cat'); // false

  // Change the remote instance
  await set.add('dog');
  await set.has('dog'); // true
});

// Use RemotePromise virtual path:
remoteLibrary.multiFunc()().then(value => {
  // value === 'Yes!'
});
```

### API Reference
Remote-lib is build with many small sub-packages, each package implement a small part of this library.
You can read here the [full API Reference](http://www.remotelib.com).

| module | version | description |
|---|---|---|
| **[remote-lib](packages/remote-lib)** | [![view on npm](http://img.shields.io/npm/v/remote-lib.svg)](https://www.npmjs.org/package/remote-lib) | A high level API for creating remote libraries.
| **[remote-context](packages/remote-context)** | [![view on npm](http://img.shields.io/npm/v/remote-context.svg)](https://www.npmjs.org/package/remote-context) | The core of `remote-lib`, creating and serving remote context.
| **[remote-environment](packages/remote-environment)** | [![view on npm](http://img.shields.io/npm/v/remote-environment.svg)](https://www.npmjs.org/package/remote-environment) | A shared environment context between remote peers.
| **[remote-instance](packages/remote-instance)** | [![view on npm](http://img.shields.io/npm/v/remote-instance.svg)](https://www.npmjs.org/package/remote-instance) | A stream transformer that can parse and `construct` instances remotely.
| **[remote-protocol](packages/remote-protocol)** | [![view on npm](http://img.shields.io/npm/v/remote-protocol.svg)](https://www.npmjs.org/package/remote-protocol) | The core of `remote-context` protocol.
| **[reference-context](packages/reference-context)** | [![view on npm](http://img.shields.io/npm/v/reference-context.svg)](https://www.npmjs.org/package/reference-context) | Virtual context implementation on vanilla Javascript.


### License

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
