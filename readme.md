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

const sum = curry ((a, b, c) => a + b + c);

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
import curry from 'kurrie';

const map = curry ((iteratee, list) => list.map (iteratee));
const sum = curry ((x, y) => x + y);

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
import curry, { _ } from 'kurrie';

const map = curry ((iteratee, list) => list.map (iteratee));
const forEachUser = map (_, ['John', 'Ed', 'Albert']);

const greet = curry ((greeting, name) => `${greeting} ${name}!`);

forEachUser (greet ('Hello'))  // => ['Hello John!', 'Hello Ed!', 'Hello Albert!']
```

## API

#### kurrie({function} fn[, {number=} arity]) => {function}
The default export. Curries functions up to `arity`, which defaults to `fn.length`.



#### kurrie.to({number} arity, {function} fn) => {function}
**An alias for the `kurrie` method that is arity first.**    
`kurrie.to` offers a cleaner syntax when you need to specify an arity value.

```js
// Since `c` is an optional argument, the arity of this function is 2 by default,
// since rest and optional params don't count when accessing `fn.length`. However,
// you can manually force the arity to 3 using kurrie.to.
const sum = kurrie.to (3, function (a, b, c = 3) {
  return a + b + c;
});

sum (1) (2) (undefined); // => 6
sum (1) (2) (10);        // => 13
```

#### kurrie.proto({function} fn[, {number=} arity][, {number=} thisArgPosition]]) => {function}
**A convenience method to curry prototype methods**.    
Curries the given prototype method passing the *last* argument as the `this` value.

```js
const map = kurrie.proto (Array.prototype.map);
map (x => x * 2) ([1, 2, 3]); // => [2, 4, 6]

const toUpperCase = kurrie.proto (String.protoype.toUpperCase);
toUpperCase ('foo') // => 'FOO'

const replace = kurrie.proto (String.protoype.replace);
const swap = replace (/^hello/, 'goodbye');
swap ('hello world!'); // 'goodbye world!'
```

You can override the arity of the curried prototype method using the optional `arity` argument.

Additionally, you can supply the value of the `this` argument which the prototype method will be
called on using the `thisArgPosition` parameter. By default, the last argument passed (up to the
maximum arity) will the used.

### isCurried({function} fn) => {boolean}
**Determines is `fn` is a curried function.**    
Returns `true` if the supplied function is curried using `kurrie`, `false` otherwise.

```js
import curry from 'kurrie';

const curried = curry (function () { ... });
```

```js
import { isCurried } from 'kurrie';

isCurried (someFunction);
```

### getSourceFunction({function} fn) => {function|undefined}
**Returns the source (original, uncurried) version of a curried function.**    
Some libraries call this "uncurry".

```js
import { getSourceFunction } from 'kurrie';

const notCurried = getSourceFunction (curriedFunction);
```

### curryTo
**Alias for `kurrie.to`.**

```js
import { curryTo } from 'kurrie';

const sum = kurrie.to (3, function (a, b, c = 3) { ... });
```

### curryProto
**Alias for `kurrie.proto`.**

```js
import { curryProto } from 'kurrie';

const slice = kurrie.proto (Array.prototype.slice);
const sliced = slice (0, 2) ([0, 1, 2, 3]) // => [0, 1, 2]
```

## Benchmarks
