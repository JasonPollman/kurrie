# kurrie
JavaScript's highly optimized and speedy currying function.

## Install
```bash
npm install kurrie --save
```

## Motivation
Mostly for fun. However, as I was comparing `kurrie` to other curry functions available on npm,
I found that most of the larger libraries were pretty slow by comparison. `kurrie` focuses on
flexibility without sacrificing speed. See the [benchmarks](#benchmarks) below.

## Usage
**`kurrie` curries functions with support for both placeholders and partial application.**   
This means that the all of the various calls to `sum` below will evaluate to `6`.

```js
import curry from 'kurrie';

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
You can use the export `_` as a placeholder value, which means "skip" this argument and expect
it in the next invocation. Alternatively, since `_` is typically reserved for lodash, `kurrie`
also exports `__` which can also be used for placeholder values.

```js
import kurrie, { _ } from 'kurrie';

const map = kurrie ((iteratee, list) => list.map (iteratee));
const forEachUser = map (_, ['John', 'Ed', 'Albert']);

const greet = kurrie ((greeting, name) => `${greeting} ${name}!`);

forEachUser (greet ('Hello'))  // => ['Hello John!', 'Hello Ed!', 'Hello Albert!']
```

## API

### kurrie({function} fn[, {Object=} options]) => {function}
The default export. Curries the given function up to `arity` (which defaults to `fn.length`).

| Property | Default     | Description |
| -------- | ----------- | ----------- |
| arity    | `fn.length` | The number of arguments that must be met before invoking `fn`. |
| capped   | `true`      | If true, no arguments passed to `fn` will exceed `arity`. If false arguments exceeding arity may "leak" into invocations. |

**You should note the behavior of fn.length in regard to rest and default parameters!**
See [MDN] for documentation on `Function#length`. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length).

For example:

**If `capped` is `true`**

```js
const x = kurrie ((x, y = 1) => [x, y]);
x(1, 2); // => [1, 1];
```

**If `capped` is `false`**

```js
const x = kurrie ((x, y = 1) => [x, y]);
x(1, 2); // => [1, 2];
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

| Property        | Default     | Description |
| --------------- | ----------- | ----------- |
| arity           | `fn.length` | The number of arguments that must be met before invoking `fn`. |
| capped          | `true`      | If true, no arguments passed to `fn` will exceed `arity`. If false arguments exceeding arity may "leak" into invocations. |
| thisArgPosition | `arity - 1` | The argument to use as the `this` context when applying arguments to the prototype method. For example, using Array#filter: `Array.prototype.filter.apply(arguments[thisArgPosition], args);`. This defaults to the last argument passed to the function (i.e. arity - 1). |

```js
const map = kurrie.proto (Array.prototype.map);
map (x => x * 2) ([1, 2, 3]); // => [2, 4, 6]

const toUpperCase = kurrie.proto (String.protoype.toUpperCase);
toUpperCase ('foo') // => 'FOO'

const replace = kurrie.proto (String.protoype.replace);
const swap = replace (/^hello/, 'goodbye');
swap ('hello world!'); // 'goodbye world!'
```

**Example of overriding the arity:**

```js
// Default
const slice = kurrie.proto (String.prototype.slice);
slice(0)(3)('foobar'); // => 'foo'

// Omitting slice's end argument
const slice = kurrie.proto (String.prototype.slice, { arity: 2 });
slice(2)('foobar'); // => 'obar'
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
import kurrie, { getSourceFunction } from 'kurrie';

const sum = kurrie ((x, y) => x + y);
sum(1)(2) // => 3

const uncurried = getSourceFunction (sum);
uncurried(1, 2) // => 3
uncurried(1)(2) // => Error
```

### curryTo
**Named export for `kurrie.to`.**

```js
import { curryTo } from 'kurrie';

const sum = kurrie.to (3, function (a, b, c = 3) { ... });
```

### curryProto
**Named export for `kurrie.proto`.**

```js
import { curryProto } from 'kurrie';
const slice = kurrie.proto (Array.prototype.slice);
const sliced = slice (0, 2) ([0, 1, 2, 3]) // => [0, 1, 2]
```

## Benchmarks
