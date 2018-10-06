/**
 * A highly optimized currying library focused on performance.
 * Support for partial applications and placeholders.
 * Supported by node and browsers IE11+.
 * @author Jason James Pollman <jasonjpollman@gmail.com>
 * @license ISC
 * @since 10/3/18
 * @file
 */

/**
 * The prefix to inject in front of pseudo symbols.
 * @type {string}
 */
const SYMBOL_PREFIX = '@@kurrie';

/**
 * "Polyfilling" symbol in the event it doesn't exist (IE 11).
 * @param {string} label The symbol's label.
 * @returns {string|Symbol} A string, if symbols are unavailable.
 */
const Sym = typeof Symbol === 'function' ? Symbol : (label => SYMBOL_PREFIX.concat(label));

/**
 * Used to recognize curried functions.
 * @type {Sym}
 */
const IS_CURRIED_FUNCTION = Sym('IS_CURRIED_FUNCTION');

/**
 * Used to map curried functions back to their original source function.
 * @type {Sym}
 */
const SOURCE_FUNCTION = Sym('SOURCE_FUNCTION');

/**
 * A default placeholder value.
 * Used for partial application to curried functions.
 * @type {Sym}
 */
export const _ = Sym('CURRY_DEFAULT_PLACEHOLDER');

/**
 * Privately stores all registered placeholder values.
 * Users can use `registerPlaceholder` (below) to add to this array.
 * @type {Array}
 */
const placeholders = [_];

/**
 * Determines if `value` is a placeholder.
 * @param {any} thing The value to inspect.
 * @returns {Boolean} True is value is a placeholder, false otherwise.
 * @export
 */
export function isPlaceholder(thing) {
  const size = placeholders.length;

  for (let i = 0; i < size; i++) {
    if (placeholders[i] === thing) return true;
  }

  return false;
}

/**
 * Registers a placeholder.
 * @param {any} placeholder The placeholder to register.
 * @returns {undefined}
 * @export
 */
export function registerPlaceholder(placeholder) {
  if (!isPlaceholder(placeholder)) {
    placeholders.push(placeholder);
  }
}

/**
 * Determines is the given function has been curried using kurrie.
 * @param {function} fn The function to inspect.
 * @returns {Boolean} True if `fn` is a curried function, false otherwise.
 */
export function isCurried(fn) {
  return !!(fn && fn[IS_CURRIED_FUNCTION]);
}

/**
 * Returns a curried function's source (original, uncurried) function.
 * @param {function} fn The function to get the source function for.
 * @returns {function|undefined} The function's source function.
 */
export function getSourceFunction(fn) {
  return fn ? fn[SOURCE_FUNCTION] : undefined;
}

/**
 * "Bubbles" (moves) literal values from `reargs` to `preargs`.
 * This is effectively replacing the placeholder provided to a
 * previous invocation with the literal value (or new placeholder)
 * from the current invocation.
 * @param {Array} preargs Previous invocation arguments.
 * @param {Array} reargs Current invocation arguments.
 * @returns {Array} A shallow clone of `preargs`, with placeholders
 * replaced from `reargs` and all remaining `reargs` appended. This
 * will be the next `preargs` argument in the subsequent invocation.
 */
function bubblePlaceholders(preargs, reargs) {
  const size = preargs.length;
  if (!size) return reargs;

  // Array() is much faster than [].
  // eslint-disable-next-line
  const args = Array();

  let bubbling = true;

  // Shallow copy preargs into args and at the same time replace
  // placeholders in `args` with literal values from `reargs`.
  for (let i = 0; i < size; i++) {
    args[i] = preargs[i];

    if (bubbling && isPlaceholder(args[i])) {
      args[i] = reargs.shift();
      if (!reargs.length) bubbling = false;
    }
  }

  // Don't need to prune/append any reargs.
  const rsize = reargs.length;
  if (!rsize) return args;

  // Iterate over remaining reargs and set them on the new args set.
  // This will join the two sets of arguments together to become
  // `preargs` in the next curried invocation. Here we're skipping
  // any trailing placeholders to keep the argument set smaller since
  // they're useless anyways.
  let appending = false;

  for (let i = rsize - 1; i >= 0; i--) {
    const rearg = reargs[i];

    if (!appending && !isPlaceholder(rearg)) appending = true;
    if (appending) args[size + i] = rearg;
  }

  // REMOVE
  // for (let i = 0; i < rsize; i++) args[size + i] = reargs[i];
  return args;
}

/**
 * Determines if an argument set contains no placeholders for the entirety of its arity.
 * Basically, it anwsers: "have all placeholders been replaced?"
 * @param {Array} args The arguments to inspect.
 * @param {number} arity The arity of the curried function.
 * @returns {boolean} True if the invocation at this point has a formal argument set.
 */
function hasFormalArityArguments(args, arity) {
  for (let i = 0; i < arity; i++) {
    if (isPlaceholder(args[i])) return false;
  }

  return true;
}

/**
 * Called before the source (original) function is invoked
 * to cleanup any "stray" placeholders that might have leaked
 * into the arguments set due to the user adding "extraneous"
 * (trailing) placeholders beyond the arity of the function.
 * @param {Array} args The arguments to sanitize.
 * @param {number} arity The arity of the source function.
 * @returns {Array} The original `args` passed in.
 */
function handleExtraneousPlaceholders(args, arity) {
  const size = args.length;

  for (let i = arity; i < size; i++) {
    // Intentionally mutating `args` for performance reasons.
    // eslint-disable-next-line no-param-reassign
    if (isPlaceholder(args[i])) args[i] = undefined;
  }

  return args;
}

/**
 * The `toString` implementation for curried functions.
 * @returns {string} The source function's code with a comment
 * informing the user that the function is curried.
 */
function toStringForCurried() {
  const source = (this[SOURCE_FUNCTION] || { toString: () => '' });
  return '/* Wrapped with kurrie */\n'.concat(source.toString());
}

/**
 * Returns the curried version of `fn`.
 * This is a wrapper function that's recursively called on
 * subsequent curried invocations. It's used to provide a
 * closure around the current invocation containing the
 * previous invocations argument set.
 * @param {any} context The context to call the source function using.
 * @param {function} fn The source (original) function that's been curried.
 * @param {number} arity The arity of the source function.
 * @param {Array} preargs The "previous" set of arguments that have
 * been accumulated at this point in invocation.
 * @returns {any} Either a "recurried" function or the results
 * of the invocation of the original function.
 */
function recurry(context, fn, arity, preargs) {
  // eslint-disable-next-line require-jsdoc
  function curried(...reargs) {
    if (!reargs.length) return curried;

    const self = context || this;
    const args = bubblePlaceholders(preargs, reargs);

    return args.length >= arity && hasFormalArityArguments(args, arity)
      ? fn.apply(self, handleExtraneousPlaceholders(args, arity))
      : recurry(self, fn, arity, args);
  }

  curried[SOURCE_FUNCTION] = fn;
  curried[IS_CURRIED_FUNCTION] = true;
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
export default function curry(fn, arity = fn.length) {
  if (typeof fn !== 'function') {
    throw new Error('Expected a function for parameter `fn`');
  }

  const ary = Number(arity);

  if (typeof ary !== 'number' || (!ary && arity !== 0) || ary < 0) {
    throw new Error(`Invalid arity value: ${arity}`);
  }

  // Don't recurry curried functions, that would be an exercise in deoptimization.
  // Also don't curry functions that expect zero arguments.
  return isCurried(fn) || ary === 0 ? fn : recurry(undefined, fn, ary, []);
}

/**
 * A variant of `curry` with the `fn` and `arity` arguments swapped.
 * @param {number} arity The arity of `fn` or
 * a specific arity override to curry `fn` to.
 * @param {function} fn The function to curry.
 * @returns {function} The curried function.
 * @export
 */
export function curryTo(arity, fn) {
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
 * const isOdd = (x => x % 2)
 * isOdd([1, 2, 3]) => [1, 3]
 *
 * // Convert String#toUpperCase to a curried method.
 * const toUpperCase = curry.proto(String.prototype.toUpperCase);
 * toUpperCase('foobar') // => 'FOOBAR'
 * @export
 */
export function curryProto(fn, arity = fn.length + 1, thisArgPosition) {
  const ary = Number(arity);
  const pos = Number(thisArgPosition);
  const idx = pos || pos === 0 ? pos : ary - 1;

  // eslint-disable-next-line require-jsdoc
  function prototypeWrapperForCurrying(...args) {
    const applied = [];

    let context;
    for (let i = 0; i < arity; i++) {
      if (i === idx) context = args[i]; else applied.push(args[i]);
    }

    return fn.apply(context, applied);
  }

  prototypeWrapperForCurrying.toString = fn.toString.bind(fn);
  return curry(prototypeWrapperForCurrying, ary);
}

curry.to = curryTo;
curry.proto = curryProto;
