[![view on npm](http://img.shields.io/npm/v/remote-context.svg)](https://www.npmjs.org/package/remote-context)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/remote-context)](https://david-dm.org/remotelib/remote-lib?path=packages/remote-context)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/remote-context.svg)](LICENSE)

# Remote-context
Create a virtual context and share it remotely with other peers via **ANY** stream object 💫.

Using only a [Duplex stream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) such as 
[TCP soocket](https://nodejs.org/api/net.html#net_net_createconnection_options_connectlistener), 
[WebSocket](https://www.npmj.com/package/websocket-stream) or even 
[WebRTC DataChannel](https://www.npmjs.com/package/simple-peer) with this library you can just share
your code with other peers without worrying for API interfaces or RPC integration. Your users 
will be able to use your code remotely exactly as you write it. Including calling functions with 
callbacks, Promises, class inheritance and more.

This library is the core of [remote-lib](https://www.npmjs.org/package/remote-lib) module.

## Install
```
npm install remote-context
```

## Usage
### On the server
```js
const net = require('net');

// Get the context and the environment
const { Context } = require('remote-context');
const envContext = require('remote-context/envs/es6-unstable');

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
      setTimeout(() => resolve({ data: 'Tada!' }), 100),
    ),

  // Classes and objects
  myThings: new Set(['car', 'keys', 'pizza']),
});

// Create a server and serve each client the context remotely
const server = net.createServer(socket => {
  context.remote(socket);
});

// Bind on port 3000
server.listen(3000);
```

### On the client
```js
const net = require('net');

// Get the context and the environment
const { Context } = require('remote-context');
const envContext = require('remote-context/envs/es6-unstable');

// Connect to the server and get a stream
const socket = net.createConnection(3000);

// Create the remote context
const clientContext = new Context(envContext);
const remoteContext = clientContext.remote(socket);

// Get the remote "foo"
remoteContext.fetch('foo').then(value => {
  // value === 'bar'
});

// Run the remote function "getRandom"
remoteContext.fetch('getRandom')().then(value => {
  // `value` is random number
});

// Run the remote async function "getData"
remoteContext.fetch('getData')().then(value => {
  // value === { data: 'Tada!' }
});

// Get remote instance set "myThings"
remoteContext.fetch('myThings').then(async set => {
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
```

## Supported Environments

**Remote-context** is currently supporting only limited number of environment contexts.
To use an environment you should require it explicitly:

```js
const envContext = require('remote-context/envs/ENV_NAME');
```

When `ENV_NAME` is the required environment name.

Name | Status | Description
--- | --- | ---
`es6-unstable` | AVAILABLE | A development version of ES6 context. This environment consider unstable and may change over the versions.
`node6-unstable` | IN_DEVELOPMENT | This environment will include all Node.js version 6 context. This environment consider unstable and may change over the versions.


## API Reference

This module is a part of the [`remote-lib`](http://www.remotelib.com) library.

Here is the relevant documentation for this module:

- [`Context`](http://www.remotelib.com/class/packages/remote-context/src/Context.js~Context.html)
- [`EnvContext`](http://www.remotelib.com/class/packages/remote-context/src/EnvContext.js~EnvContext.html)
- [`RemoteContext`](http://www.remotelib.com/class/packages/remote-context/src/RemoteContext.js~RemoteContext.html)
- [`RemoteSession`](http://www.remotelib.com/class/packages/remote-context/src/RemoteSession.js~RemoteSession.html)
- [`es6UnstableEnv`](http://www.remotelib.com/typedef/index.html#static-typedef-es6UnstableEnv)
- [`observe`](http://www.remotelib.com/class/packages/remote-context/src/RemoteValue.js~RemoteValue.html#static-method-observe)

<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
