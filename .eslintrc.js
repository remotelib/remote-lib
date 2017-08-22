const fs = require('fs');
const escapeStringRegexp = require('escape-string-regexp');

/**
 * ESLint configuration
 * http://eslint.org/docs/user-guide/configuring
 */

const copyrightTemplate = fs.readFileSync(`${__dirname}/config/copyright.js`).toString();
const copyrightMatch = escapeStringRegexp(copyrightTemplate).replace('<%= YEAR %>', '20\\d\\d');

module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier', 'json', 'notice', 'mocha'],

  env: {
    node: true,
    mocha: true,
  },

  rules: {
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-skipped-tests': 'error',
    'mocha/no-global-tests': 'error',
    'mocha/handle-done-callback': 'error',
    'mocha/no-identical-title': 'error',
    'mocha/no-nested-tests': 'error',
    'mocha/no-top-level-hooks': 'error',

    'notice/notice': ['error',
      {
        mustMatch: copyrightMatch,
        template: copyrightTemplate,
      },
    ],

    // Validate Javascript documentation comments
    // http://eslint.org/docs/rules/valid-jsdoc
    'valid-jsdoc': ['error', {
      "prefer": {
        "arg": "param",
        "argument": "param",
        "class": "constructor",
        "returns": "return",
        "virtual": "abstract"
      },
      "preferType": {
        "Boolean": "boolean",
        "bool": "boolean",
        "Number": "number",
        "Object": "object",
        "String": "string",
        "Function": "function",
        "Symbol": "symbol",
        "array": "Array",
        "buffer": "Buffer",
        "promise": "Promise"
      },
      "requireParamDescription": false,
      "requireReturnDescription": false,
    }],

    'import/no-extraneous-dependencies': [
      'error', {
        devDependencies: [
          "test/*.js",
          "**/test/*.js",
          "**/test/**/*.js",
        ],
      },
    ],


    // Recommend not to leave any console.log in your code
    // Use console.error, console.warn and console.info instead
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'info'],
      },
    ],

    // ESLint plugin for prettier formatting
    // https://github.com/prettier/eslint-plugin-prettier
    'prettier/prettier': [
      'error',
      {
        // https://github.com/prettier/prettier#options
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],
  },
};
