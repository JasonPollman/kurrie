# kurrie
The fast currying library.

## Install
```bash
npm install kurrie --save
```

## Usage
```js
import curry from 'kurrie';

const map = curry((iteratee, list) => list.map(iteratee));
const sum = curry((x, y) => x + y);

const inc = sum(1);

map (inc, [1, 2, 3]);      // => [2, 3, 4]
map (sum (1)) ([1, 2, 3]); // => [2, 3, 4]
```

### Partial Placeholders
```js
import curry, { _ } from 'kurrie';

const greet = curry((greeting, name) => `${greeting} ${name}!`);
const greetFred = greet(_, 'Fred');

greetFred('Hello');         // => 'Hello Fred!'
greet (_, 'Fred') ('Hello') // => 'Hello Fred!'
```

```js
import curry from 'kurrie';

const map = curry((iteratee, list) => list.map(iteratee));
const pow = curry((x, y) => x ** y);

const square = pow(_, 2);

map (square) ([1, 2, 3]);     // => [1, 4, 9]
map (pow (_, 2)) ([1, 2, 3]); // => [1, 4, 9]
map (pow (_, 2), [1, 2, 3])   // => [1, 4, 9]
```

## API

#### kurrie({function} fn[, {number=} arity]) => {function}

#### kurrie.to({number} arity, {function} fn) => {function}
**An alias for the `kurrie` method that is arity first.**    
`kurrie.to` offers a cleaner syntax when you need to specify an arity value.

```js
// Since `c` is an optional argument, the arity of this function is 2 by default,
// since rest and optional params don't count when accessing `fn.length`. However,
// you can manually force the arity to 3 using kurrie.to.
const sum = kurrie.to(3, function (a, b, c = 4) {
  return a + b + c;
});

sum (1) (2) (3) (undefined); // => 10
```

#### kurrie.proto({function} fn[, {number=} arity][, {number=} thisArgPosition]]) => {function}
**A convenience method to curry prototype methods**.    
This curries a wrapper around the given prototype method, which will invoke it with `Function.call`,
providing the *last* argument as the `this` value.

```js
const map = kurrie.proto (Array.prototype.map);
map (x => x * 2) ([1, 2, 3]); // => [2, 4, 6]

const toUpperCase = kurrie.proto(String.protoype.toUpperCase);
toUpperCase ('foo') // => 'FOO'

const replace = kurrie.proto (String.protoype.replace);
const swap = replace (/^hello/, 'goodbye');
swap ('hello world!'); // 'goodbye world!'
```

You can override the arity of the curried prototype method using the optional `arity` argument.

Additionally, you can supply the value of the `this` argument which the prototype method will be
called with using the `thisArgPosition` parameter. By default, the last argument passed (up to the
maximum arity) will the used.

### _
### registerPlaceholder
### isCurried
### isPlaceholder
### getSourceFunction
### curryTo
### curryProto