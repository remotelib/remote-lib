/* eslint-disable prettier/prettier */

// eslint-disable-next-line
const GeneratorFunction = (function*(){})().constructor;

export default {
  '(function*(){})().constructor': GeneratorFunction,
  '(function*(){})().constructor.constructor': GeneratorFunction.constructor,
  '(function*(){})().constructor.prototype': GeneratorFunction.prototype,
  '(function*(){})().constructor.prototype.next': GeneratorFunction.prototype.next,
  '(function*(){})().constructor.prototype.return': GeneratorFunction.prototype.return,
  '(function*(){})().constructor.prototype.throw': GeneratorFunction.prototype.throw,
};
