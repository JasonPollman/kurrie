'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isCurried = isCurried;
exports.getSourceFunction = getSourceFunction;
exports.default = curry;
exports.curryTo = curryTo;
exports.curryProto = curryProto;
/**
 * A highly optimized currying library focused on performance.
 * Support for partial applications and placeholders.
 * Supported by node and browsers (at least IE11+).
 * @author Jason James Pollman <jasonjpollman@gmail.com>
 * @license ISC
 * @since 10/3/18
 * @file
 */

/* eslint-disable no-array-constructor, prefer-rest-params, no-underscore-dangle, require-jsdoc */

/**
 * The prefix to inject in front of pseudo symbols.
 * @type {string}
 */
var SYMBOL_PREFIX = '@@kurrie/';

/**
 * "Polyfilling" symbol in the event it doesn't exist (IE 11).
 * @param {string} label The symbol's label.
 * @returns {string|Symbol} A string, if symbols are unavailable.
 */
var Sym = typeof Symbol === 'function' ? Symbol : function (label) {
  return SYMBOL_PREFIX.concat(label);
};

/**
 * Used to map curried functions back to their original source function.
 * @type {Sym}
 */
var SOURCE_FUNCTION = Sym('SOURCE_FUNCTION');

/**
 * A default placeholder value.
 * Used for partial application to curried functions.
 * @type {Sym}
 */
var _ = exports._ = Sym('KURRIE_PLACEHOLDER');

/**
 * An alternative placeholder value.
 * @type {Sym}
 */
var __ = exports.__ = _;

/**
 * Determines is the given function has been curried using kurrie.
 * @param {function} fn The function to inspect.
 * @returns {Boolean} True if `fn` is a curried function, false otherwise.
 */
function isCurried(fn) {
  return !!(fn && fn[SOURCE_FUNCTION]);
}

/**
 * Returns a curried function's source (original, uncurried) function.
 * @param {function} fn The function to get the source function of.
 * @returns {function|undefined} The function's source function.
 */
function getSourceFunction(fn) {
  return fn ? fn[SOURCE_FUNCTION] : undefined;
}

/**
 * The `toString` implementation for curried functions.
 * @returns {string} The source function's code with a comment
 * informing the user that the function is curried.
 */
function toStringForCurried() {
  return '/* Wrapped with kurrie */\n'.concat(this[SOURCE_FUNCTION].toString());
}

/**
 * Combines the previous invocation's arguments and the current invocation's.
 * This also replaces placeholders in the previous invocation's arguments with
 * current invocation values.
 * @param {Arguments} prev The previous invocation's arguments.
 * @param {Arguments} curr The current invokcation's arguments.
 * @param {number} arity The arity of the source function (`fn`).
 * @returns {Array} The "concatenated" arguments.
 */
function concat(prev, curr) {
  var args = new Array();

  var i = 0;
  var index = 0;

  // Copy all previous arguments to the next arguments set.
  // Also, if the previous argument is a placeholder, replace
  // it with the value from the current argument set.
  for (; i < prev.length; i++) {
    args[i] = prev[i] === _ && index < curr.length ? curr[index++] : prev[i];
  }

  // Copy remaining arguments from the current argument set
  // onto the next argument set, starting from where we stopped
  // pulling placeholders from.
  while (index < curr.length) {
    args[i++] = curr[index++];
  }

  return args;
}

/**
 * "Recurries" a curried function (called by `curried` below).
 * @param {function} curried The `curried` function from below.
 * @param {Arguments} args The previous invocation's argument set.
 * @param {number} arity The arity of the source function (`fn`).
 * @returns {function} The recurried function.
 */
function recurry(curried, args) {
  return function recurried() {
    return arguments.length ? curried.apply(this, concat(args, arguments)) : recurried;
  };
}

/**
 * Determines if an argument set has no placeholders (up to arity), which
 * indicates that it's safe to invoke the curried function's source function.
 * @param {Arguments} args The argument set to inspect.
 * @param {number} arity The arity of the source function.
 * @returns {boolean} True if it's safe to call the source functon, false otherwise.
 */
function hasFormalArguments(args, arity) {
  for (var i = 0; i < arity; i++) {
    if (args[i] === _) return false;
  }

  return true;
}

/**
 * Creates a curried version of `fn`.
 * @param {function} fn The source (original) function that's been curried.
 * @param {number} arity The arity of the source function.
 * been accumulated at this point in invocation.
 * @returns {function} The curried function.
 */
function create(fn, arity) {
  function curried() {
    var size = arguments.length;

    if (size >= arity && hasFormalArguments(arguments, arity)) {
      return fn.apply(this, arguments);
    }

    if (size) {
      var recurried = recurry(curried, arguments);
      recurried[SOURCE_FUNCTION] = curried;
      recurried.toString = toStringForCurried;
      return recurried;
    }

    return curried;
  }

  curried[SOURCE_FUNCTION] = fn;
  curried.toString = toStringForCurried;
  return curried;
}

/**
 * Curries a function.
 * @param {function} fn The function to curry.
 * @param {number} [arity=fn.length] The arity of `fn` or
 * a specific arity override to curry `fn` to.
 * @returns {function} The curried version of `fn`.
 * @export
 * @example
 * const curried = curry((x, y, z) => x + y + z);
 * curried()        // => curried
 * curried(1)       // => [object Function]
 * curried(1)(2)    // => [object Function]
 * curried(1)(2)(3) // => 6
 * curried(1, 2)(3) // => 6
 * curried(1)(2, 3) // => 6
 * curried(1, 2, 3) // => 6
 *
 * // You can also use partial application (placeholders)...
 * const triples = curry((a, b, c) => [a, b, c]);
 * triples(_, 2, 3)(1)    // => [1, 2, 3]
 * triples(_, _, 3)(1)(2) // => [1, 2, 3]
 * triples(1)(_)(2)(_)(3) // => [1, 2, 3]
 * triples(1)(_, 3)(2)    // => [1, 2, 3]
 * triples(_, 2)(1)(3)    // => [1, 2, 3]
 */
function curry(fn) {
  var arity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fn.length;

  if (typeof fn !== 'function') {
    throw new Error('Expected a function for parameter `fn`');
  }

  if (fn[SOURCE_FUNCTION] || arity === 0) return fn;
  if (arity > 0) return create(fn, arity);

  throw new Error('Invalid arity value: ' + arity);
}

/**
 * A variant of `curry` with the `fn` and `arity` arguments swapped.
 * In this variant, arity must be specified.
 * @param {number} arity The arity of `fn` or a specific arity override to curry `fn` to.
 * @param {function} fn The function to curry.
 * @returns {function} The curried function.
 * @export
 */
function curryTo(arity, fn) {
  return curry(fn, arity);
}

/**
 * Used to curry prototype methods.
 * This will wrap the given prototype method to use Function.call,
 * providing the *last* argument provided as the `this` value for the call.
 *
 * See the example below for insight. If called on a regular function,
 * this could produce some interesting (unexpected) results.
 * @param {function} fn The prototype method to curry.
 * @param {number=} arity The arity of `fn` or
 * a specific arity override to curry `fn` to.
 * @param {number=} thisArgPosition The position of the argument to use
 * as the `this` argument when invoking the prototype method (as an override).
 * @returns {function} The curried method.
 * @example
 * // Convert Array#map to a curried method.
 * const map = curry.proto(Array.prototype.map);
 * map (x => x * 2) ([1, 2, 3]); // => [2, 4, 6]
 *
 * // Convert Array#filter to a curried method.
 * const filter = curry.proto(Array.prototype.filter);
 * const isOdd = filter(x => x % 2)
 * isOdd([1, 2, 3]) => [1, 3]
 *
 * // Convert String#toUpperCase to a curried method.
 * const toUpperCase = curry.proto(String.prototype.toUpperCase);
 * toUpperCase('foobar') // => 'FOOBAR'
 *
 * // Convert String#slice to a curried method
 * const slice = curry.proto(String.prototype.slice);
 * slice(0)(3)('foobar') // => 'foo'
 *
 * // Setting the arity to 2 to omit the end argument.
 * const sliceS = curry.proto(String.prototype.slice, 2);
 * sliceS(3)('foobar') // => 'bar'
 * @export
 */
function curryProto(fn) {
  var arity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fn.length + 1;
  var thisArgPosition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : arity - 1;

  function wrapper() {
    var size = arguments.length;
    var applied = new Array();

    for (var i = 0, n = 0; i < size; i++) {
      if (i !== thisArgPosition) applied[n++] = arguments[i];
    }

    return fn.apply(arguments[thisArgPosition], applied);
  }

  wrapper.toString = fn.toString.bind(fn);
  return curry(wrapper, arity);
}

curry._ = _;
curry.__ = _;
curry.to = curryTo;
curry.proto = curryProto;
