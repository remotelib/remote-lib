<h1 align="center">
  <br>
  <a href="http://www.remotelib.com"><img src="https://github.com/remotelib/remote-lib/raw/master/manual/asset/icon.png?docs-hack=.svg" alt="RemoteLib" width="200"></a>
  <br>
  RemoteLib
  <br>
  <br>
</h1>

<h4 align="center">Convert your JavaScript library to a remote service 💫.</h4>

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

##### Is it kind of RPC?
No. RemoteLib is based on [remote-context](packages/remote-context) and won't just proxying 
your functions. Instead, you have an entirely shared context between two remote peers. See 
[Features](#features) for more details:

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


### Getting Started

#### Simple "Hello World" library

Create a context and a server:
```js
const net = require('net');
const { Library } = require('remote-lib');

// Create the library context
const library = new Library({
  hello: 'World!',
});

// Create a server and serve each client the context remotely
const server = net.createServer(socket => {
  library.serve(socket);
});

// Bind on port 3000
server.listen(3000);
```

On the client side, we just need to connect to the server an create our remote library. Notice 
that the server and the client sharing only a single socket without any knowledge of the server 
library format. You can easily replace the socket it with 
 [WebSocket](https://www.npmjs.com/package/websocket-stream) or even 
[WebRTC DataChannel](https://www.npmjs.com/package/simple-peer).

```js
const net = require('net');
const { RemoteLibrary } = require('remote-lib');

// Connect to the server and get a stream
const socket = net.createConnection(3000);

// Create the remote library
const remoteLibrary = new RemoteLibrary(socket);

// Get the remote "hello" value
remoteLibrary.hello.then(value => {
  // value === 'World!'
});
```

#### Calling remote functions

RemoteLib supporting calling remote functions as well:

```js
// On the server:
const library = new Library({
  // Simple functions
  foo() {
     return 'bar';
  },
  
  // Async functions
  getData: () =>
    new Promise(resolve =>
      setTimeout(() => resolve({ data: 'Tada!' }), 100),
    ),
  
  // Functions with callbacks
  loadInfo: callback => {
    setTimeout(callback(123), 200); // call callback after 200ms
  },
  
  // Functions of functions
  sum: x => y => x + y,
});
```

```js
// On the client:
remoteLibrary.foo().then(value => {
  // value === 'bar' 
});

// Promises already handled for you 
remoteLibrary.getData().then(value => {
  // value == { data: 'Tada!' }
});

// Promises already handled for you 
remoteLibrary.loadInfo(value => {
  // value === 123
}).catch(err => {
  // if there's an error while calling loadInfo()
});

remoteLibrary.sum(5).then(async sum2 => {
  await sum2(2); // 7 
});

// You can even speed things up by using the virtual-path promise:
remoteLibrary.multiFunc(3)(2).then(value => {
  // value === 5 
});
```

#### Using remote classes
Use can use build-in classes or create one by your own:

```js
// On the server
class MyClass {
  constructor(i) {
    this.i = i;
  }
  
  inc() {
    this.i += 1;
    return this.i;
  }
}

const library = new Library({
  myClass: new MyClass(5),

  // native ES6 Set class instance
  myThings: new Set(['car', 'keys', 'pizza']),
});
```

```js
// On the client:
remoteLibrary.myClass.then(async myClass => {
  // myClass.i === 5
                
  // Call methods with async promises
  await myClass.inc(); // 6
  // myClass.i === 6 
});

remoteLibrary.myThings.then(async myThings => {
  myThings instanceof Set; // true
    
  // Access cached getters instantly
  myThings.size; // 3

  await myThings.has('keys'); // true
  await myThings.has('cat'); // false

  await myThings.add('dog');
  await myThings.has('dog'); // true
});
```

#### Handling errors

RemoteLib catch all the errors for you and deliver them back to the user as-if they happens on 
the client:

```js
// On the server:
const library = new Library({
  doNotCallMe() {
     throw ReferenceError('I told you! :)');
  },
});
```

```js
// On the client:
remoteLibrary.doNotCallMe().catch(err => {
  err instanceof ReferenceError; // true
  err.message; // "I told you! :)"
});

remoteLibrary.notExistsFunction().catch(err => {
  err instanceof TypeError; // true
  err.message; // "notExistsFunction is not a function"
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
