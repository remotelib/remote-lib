[![view on npm](http://img.shields.io/npm/v/remote-environment.svg)](https://www.npmjs.org/package/remote-environment)
[![Build Status](https://travis-ci.org/remotelib/remote-lib.svg?branch=master)](https://travis-ci.org/remotelib/remote-lib)
[![Dependency Status](https://david-dm.org/remotelib/remote-lib.svg?path=packages/remote-environment)](https://david-dm.org/remotelib/remote-lib?path=packages/remote-environment)
[![codecov](https://codecov.io/gh/remotelib/remote-lib/branch/master/graph/badge.svg)](https://codecov.io/gh/remotelib/remote-lib)
[![npm license](https://img.shields.io/npm/l/remote-environment.svg)](LICENSE)

# Remote-environment
The complete context dictionary for given environment 💫.

This library contain a key-value map of the requested context, accessing the objects with their 
real paths such as `"Object.getPrototypeOf"`. All the contexts include only a variables that are 
unique for this environment and can't recreate again manually. For Example, the PI number 
`3.141592653589793` is not a unique variable but the function `Math.sin` is unique and therefore 
will be available under the path `"Math.sin"`.

## Install
```
npm install remote-environment
```

## Usage
```js
// Load the requested environment 
const context = require('remote-environment/es6');

// Access the environment objects
context['Object']; // equals to `Object`
context['Math.sin']; // equals to `Math.sin`
context['Promise.resolve']; // equals to `Promise.resolve`
context['Function.prototype']; // equals to `Function.prototype`
```

## Supported Environments

**Remote-environment** is currently supporting only limited number of environment contexts.
To use an environment you should require it explicitly:

```js
const context = require('remote-environment/ENV_NAME');
```

When `ENV_NAME` is the required environment name.

Name | Status | Description
--- | --- | ---
`es6` | UNSTABLE | An ES6 context. This environment consider unstable and may change over the versions.


## API Reference

This module is a part of the [`remote-lib`](http://www.remotelib.com) library.

Here is the relevant documentation for this module:

- [`es6`](http://www.remotelib.com/typedef/index.html#static-typedef-es6)

<br />
<br />

* * *

&copy; 2017 Moshe Simantov

Licensed under the [Apache License, Version 2.0](LICENSE).
