# kurrie
JavaScript's highly optimized and speedy currying function.

## Install
```bash
npm install kurrie --save
```

**Distributions:**
- `dist/kurrie.min.js` is UMD and can be used in browsers.
- `dist/kurrie.js` is CommonJS, and is used by node.

## Motivation
Mostly for fun. However, as I was comparing `kurrie` to other curry functions available on npm,
I found that most of the larger libraries were pretty slow by comparison. `kurrie` focuses on
flexibility without sacrificing speed. See the [benchmarks](#benchmarks) below.

## Usage
**`kurrie` curries functions with support for both placeholders and partial application.**   
This means that the all of the various calls to `sum` below will evaluate to `6`.

```js
import kurrie from 'kurrie';

const sum = kurrie ((a, b, c) => a + b + c);

sum (1, 2, 3);
sum (1, 2) (3);
sum (1) (2, 3);
sum (1) (2) (3);
sum (1, _, 3) (2);
sum (_, 2) (1) (3);
sum (_, 2, 3) (1);
sum (_, 2) (_, 3) (1);
sum (_, _, 3) (1) (2);
sum (_, _, 3) (1, 2);
sum (_, _, 3) (_, 2) (1);
```

### Basic Currying
Adding to any array of numbers.

```js
import kurrie from 'kurrie';

const map = kurrie ((iteratee, list) => list.map (iteratee));
const sum = kurrie ((x, y) => x + y);

const inc = sum (1);

map (inc, [1, 2, 3]);      // => [2, 3, 4]
map (inc) ([1, 2, 3]);     // => [2, 3, 4]

map (sum (2)) ([1, 2, 3]); // => [3, 4, 5]

```

### Partial Placeholders
You can use the export `_` as a placeholder value, which means "skip" the argument and expect
it in the next invocation.

```js
import kurrie, { _ } from 'kurrie';

const map = kurrie ((iteratee, list) => list.map (iteratee));
const forEachUser = map (_, ['John', 'Ed', 'Albert']);

const greet = kurrie ((greeting, name) => `${greeting} ${name}!`);

forEachUser (greet ('Hello'))  // => ['Hello John!', 'Hello Ed!', 'Hello Albert!']
```

Alternatively, since `_` is typically reserved for lodash, `kurrie` also exports `__` as an
alternative placeholder value.

## API

### kurrie({function} fn[, {Object=} options]) => {function}
The default export. Curries the given function up to `arity`.

**Options:**

| Property | Default     | Description |
| -------- | ----------- | ----------- |
| arity    | `fn.length` | The number of arguments that must be met before invoking `fn`. |
| capped   | `true`      | If true, the number of arguments passed to `fn` will never exceed `arity`. If false, arguments beyond `arity` may "leak" into invocations. |

**You should note the behavior of Function#length in regard to rest and default parameters!**
See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) for documentation on `Function#length`.

For example:

**If `capped` is `false`**

```js
const x = kurrie ((x, y = 3) => [x, y]);
x(1, 2); // => [1, 2];
```

**If `capped` is `true` (default)**

```js
const pairs = (x, y = 3) => [x, y];
paris.length // => 1

const x = kurrie (pairs);
x(1, 2); // => [1, 7];
```

Since `y` is a default value, it's not included in `pairs.length`. To get expected results,
set the arity of the curried version of pairs.

```js
const x = kurrie (pairs, { arity: 2 });

x(1, 2); // => [1, 2];
x(1)(2); // => [1, 2];
x(1)(undefined); // => [1, 3];
```

### kurrie.to({number} arity, {function} fn[, {boolean=} capped=true]) => {function}
**An alias for the `kurrie` method that is arity first.**    
`kurrie.to` offers a cleaner syntax when you need to specify an arity value.

```js
const sum = kurrie.to (3, function (a, b, c = 3) {
  return a + b + c;
});

sum (1) (2) (undefined); // => 6
sum (1) (2) (10);        // => 13
```

### kurrie.proto({function} fn[, {Object=} options]) => {function}
**A convenience method to curry prototype methods**.    
Curries the given prototype method passing the *last* argument as the `this` value.

**Options:**

| Property        | Default         | Description |
| --------------- | --------------- | ----------- |
| arity           | `fn.length + 1` | The number of arguments that must be met before invoking `fn`. |
| capped          | `true`          | If true, the number of arguments passed to `fn` will never exceed `arity`. If false, arguments beyond `arity` may "leak" into invocations. |
| thisArgPosition | `arity - 1`     | The argument to use as `this` when applying arguments to the prototype method. For example, with Array#filter: `Array.prototype.filter.apply(arguments[thisArgPosition], args);`. This defaults to the last argument passed to the function (i.e. arity - 1). |

```js
const map = kurrie.proto (Array.prototype.map);
map (x => x * 2) ([1, 2, 3]); // => [2, 4, 6]

const toUpperCase = kurrie.proto (String.protoype.toUpperCase);
toUpperCase ('foo') // => 'FOO'

const replace = kurrie.proto (String.protoype.replace);
const swap = replace (/^hello/, 'goodbye');
swap ('hello world!'); // 'goodbye world!'
```

**An example of overriding the arity with kurrie.proto:**

```js
// Default
const slice = kurrie.proto (String.prototype.slice);
slice(0)(3)('foobar'); // => 'foo'

// Omitting slice's "end" argument
const sliceFrom = kurrie.proto (String.prototype.slice, { arity: 2 });
sliceFrom(2)('foobar'); // => 'obar'
```

### isCurried({function} fn) => {boolean}
**Determines is `fn` is a curried function.**    
Returns `true` if the supplied function is curried using `kurrie`, `false` otherwise.

```js
import kurrie, { isCurried } from 'kurrie';

isCurried (kurrie (() => { ... }))  // => true
isCurried (() => { ... })           // => false
```

### getSourceFunction({function} fn) => {function|undefined}
**Returns the source (original, uncurried) version of a curried function.**    
Some libraries call this "uncurry".

```js
import kurrie, { getSourceFunction, uncurry } from 'kurrie';

const sum = kurrie ((x, y) => x + y);
sum(1)(2) // => 3

const uncurried = getSourceFunction (sum);
uncurried(1, 2) // => 3
uncurried(1)(2) // => Error

// `uncurry` is also provided as an alias to `getSourceFunction`
const uncurried = uncurry (sum);
```

### curryTo
**Named export for `kurrie.to`.**

```js
import { curryTo } from 'kurrie';

const sum = curryTo (3, function (a, b, c = 3) { ... });
```

### curryProto
**Named export for `kurrie.proto`.**

```js
import { curryProto } from 'kurrie';

const slice = curryProto (Array.prototype.slice);
slice (0, 2) ([0, 1, 2, 3]) // => [0, 1, 2]
```

## Benchmarks
Libraries were compared over a series of 26 different tests (see below) using the
[Benchmark Suite](https://www.npmjs.com/package/benchmark). See `bench.js` in the root of this
repo to view the benchmark tests.

The following libraries were compared to `kurrie`:
- [Lodash](https://www.npmjs.com/package/lodash)
- [Rambda](https://www.npmjs.com/package/ramda)
- [Curry](https://www.npmjs.com/package/curry)
- [Curriable](https://www.npmjs.com/package/curriable)
- [Kurry](https://www.npmjs.com/package/kurry)

### Average Operations Per Second

| Rank  | Library    | Average Operations Per Second | % Avg   |
| ----- | ---------- | ----------------------------- | ------- |
| **1** | **Kurrie** | **4,209,498**                | **177%** |
| 2     | Curriable  | 3,480,912                     | 146%    |
| 3     | Rambda     | 2,222,195                     | 94%     |
| 4     | Curry      | 1,621,990                     | 69%     |
| 5     | Lodash     | 1,384,082                     | 59%     |
| 6     | Kurry      | 1,354,722                     | 57%     |

*Benchmarks were performed on an 2.8 GHz Intel Core i7 MacBook Pro, 16GB Memory using Node.js version 8.7.0.*

### Benchmark Test Types
- Curried function initialization (creation).
- Calling a nullary curried function.
- Calling a unary curried function.
- Calling a binary curried function (multiple call configurations).
- Calling a trinary curried function (multiple call configurations).
- Calling a 20-ary curried function (multiple call configurations).
- Calling a curried function that reference `this`.
- Calls without arguments (i.e. `foo()()()(1)()(2)`).
- Multi-curried called (i.e. `map(sum(1))([1, 2 ,3])`).
- Calling curried functions with placeholders (multiple configurations).
- Currying already curried functions.
