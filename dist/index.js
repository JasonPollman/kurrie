'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPlaceholder = isPlaceholder;
exports.registerPlaceholder = registerPlaceholder;
exports.isCurried = isCurried;
exports.getSourceFunction = getSourceFunction;
exports.default = curry;
exports.curryTo = curryTo;
exports.curryProto = curryProto;
/**
 * A highly optimized currying library focused on performance.
 * Support for partial applications and placeholders.
 * Supported by node and browsers IE11+.
 * @author Jason James Pollman <jasonjpollman@gmail.com>
 * @license ISC
 * @since 10/3/18
 * @file
 */

var SYMBOL_PREFIX = '@@kurrie';

var Sym = typeof Symbol === 'function' ? Symbol : function (label) {
  return SYMBOL_PREFIX.concat(label);
};

var IS_CURRIED_FUNCTION = Sym('IS_CURRIED_FUNCTION');

var SOURCE_FUNCTION = Sym('SOURCE_FUNCTION');

var _ = exports._ = Sym('CURRY_DEFAULT_PLACEHOLDER');

var placeholders = [_];

function isPlaceholder(thing) {
  var size = placeholders.length;

  for (var i = 0; i < size; i++) {
    if (placeholders[i] === thing) return true;
  }

  return false;
}

function registerPlaceholder(placeholder) {
  if (!isPlaceholder(placeholder)) {
    placeholders.push(placeholder);
  }
}

function isCurried(fn) {
  return !!(fn && fn[IS_CURRIED_FUNCTION]);
}

function getSourceFunction(fn) {
  return fn ? fn[SOURCE_FUNCTION] : undefined;
}

function bubblePlaceholders(preargs, reargs) {
  var size = preargs.length;
  if (!size) return reargs;

  var args = Array();

  var bubbling = true;

  for (var i = 0; i < size; i++) {
    args[i] = preargs[i];

    if (bubbling && isPlaceholder(args[i])) {
      args[i] = reargs.shift();
      if (!reargs.length) bubbling = false;
    }
  }

  var rsize = reargs.length;
  if (!rsize) return args;

  var appending = false;

  for (var _i = rsize - 1; _i >= 0; _i--) {
    var rearg = reargs[_i];

    if (!appending && !isPlaceholder(rearg)) appending = true;
    if (appending) args[size + _i] = rearg;
  }

  return args;
}

function hasFormalArityArguments(args, arity) {
  for (var i = 0; i < arity; i++) {
    if (isPlaceholder(args[i])) return false;
  }

  return true;
}

function handleExtraneousPlaceholders(args, arity) {
  var size = args.length;

  for (var i = arity; i < size; i++) {
    if (isPlaceholder(args[i])) args[i] = undefined;
  }

  return args;
}

function toStringForCurried() {
  var source = this[SOURCE_FUNCTION] || { toString: function toString() {
      return '';
    } };
  return '/* Wrapped with kurrie */\n'.concat(source.toString());
}

function recurry(context, fn, arity, preargs) {
  function curried() {
    for (var _len = arguments.length, reargs = Array(_len), _key = 0; _key < _len; _key++) {
      reargs[_key] = arguments[_key];
    }

    if (!reargs.length) return curried;

    var self = context || this;
    var args = bubblePlaceholders(preargs, reargs);

    return args.length >= arity && hasFormalArityArguments(args, arity) ? fn.apply(self, handleExtraneousPlaceholders(args, arity)) : recurry(self, fn, arity, args);
  }

  curried[SOURCE_FUNCTION] = fn;
  curried[IS_CURRIED_FUNCTION] = true;
  curried.toString = toStringForCurried;
  return curried;
}

function curry(fn) {
  var arity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fn.length;

  if (typeof fn !== 'function') {
    throw new Error('Expected a function for parameter `fn`');
  }

  var ary = Number(arity);

  if (typeof ary !== 'number' || !ary && arity !== 0 || ary < 0) {
    throw new Error('Invalid arity value: ' + arity);
  }

  return isCurried(fn) || ary === 0 ? fn : recurry(undefined, fn, ary, []);
}

function curryTo(arity, fn) {
  return curry(fn, arity);
}

function curryProto(fn) {
  var arity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fn.length + 1;
  var thisArgPosition = arguments[2];

  var ary = Number(arity);
  var pos = Number(thisArgPosition);
  var idx = pos || pos === 0 ? pos : ary - 1;

  function prototypeWrapperForCurrying() {
    var applied = [];

    var context = void 0;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    for (var i = 0; i < arity; i++) {
      if (i === idx) context = args[i];else applied.push(args[i]);
    }

    return fn.apply(context, applied);
  }

  prototypeWrapperForCurrying.toString = fn.toString.bind(fn);
  return curry(prototypeWrapperForCurrying, ary);
}

curry.to = curryTo;
curry.proto = curryProto;