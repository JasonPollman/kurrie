/**
 * Performance tests comparing kurrie to other popular currying libraries.
 * The packages listed below aren't listed in the package.json and you must
 * install them yourself. Running `npm run perf` will do this for you.
 * Note, this is pretty sloppy stuff.
 * @since 10/6/18
 * @file
 */

/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle, require-jsdoc */

import R from 'rambda';
import curry from 'curry';
import kurry from 'kurry';
import lodash from 'lodash';
import assert from 'assert';
import curriable from 'curriable';

import {
  dim,
  red,
  bold,
  cyan,
  green,
  yellow,
} from 'chalk';

import kurrie, { _ } from './dist/kurrie';

const {
  get,
  each,
  keyBy,
  isEqual,
  padStart,
  identity,
  stubArray,
  isFunction,
} = lodash;

const { log } = console;
const map = kurrie.proto(Array.prototype.map);
const filter = kurrie.proto(Array.prototype.filter);
const flabel = label => (label === 'Vanilla' ? dim : cyan)(padStart(label, 9));

const TOTALS = {};
const TEST_ITERATIONS = 6e6;

function invokeTimes(fn, result, args) {
  const check = isFunction(result) ? result : isEqual;

  return () => {
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      assert(check(fn(...args), result));
    }
  };
}

function executeSingleTest(operation) {
  let duration = 0;
  let message = null;
  let valid = true;

  const start = Date.now();

  try {
    operation();
    duration = Date.now() - start;
  } catch (e) {
    duration = Date.now() - start;
    valid = false;

    if (e.code === 'ERR_ASSERTION') {
      message = red('[Invalid Results]');
    } else {
      message = red(`[Error: ${e.message}]`);
    }
  }

  return {
    valid,
    duration,
    message,
  };
}

const colors = [dim, green, identity, identity, yellow, yellow, red];

function total(group, test, duration, valid) {
  TOTALS[group] = TOTALS[group] || {};
  TOTALS[group][test] = {
    valid,
    duration,
  };
}

function toRanked(collection, attribute, reverse = true) {
  const array = lodash.map(collection, (fields, key) => ({
    ...fields,
    key,
    value: get(fields, attribute, fields),
  }));

  const sorted = array.sort((a, b) => {
    const reverseConstant = reverse ? 1 : -1;
    if (a.key === 'Vanilla') return reverseConstant;
    if (a.valid === false) return 1 - reverseConstant;
    if (b.valid === false) return reverseConstant;
    return a.value - b.value;
  });

  if (reverse) sorted.reverse();
  const data = sorted.map((props, rank) => ({ ...props, rank, color: colors[rank] }));
  return keyBy(data, 'key');
}

function invokeTest({
  test,
  label,
  result,
  prepare = stubArray,
  isUnsupported,
  group,
}) {
  if (isUnsupported) {
    return {
      library: label,
      duration: 0,
      valid: false,
      message: yellow('[Unsupported]'),
    };
  }

  const results = executeSingleTest(invokeTimes(test, result, prepare()));
  total(group, label, results.duration, results.valid);

  return {
    ...results,
    library: label,
  };
}

// Functions to be curried by the tests below...
const sum = (a, b) => a + b;
const pairs = (a, b) => [a, b];
const pairsRest = (a, b, ...rest) => [a, b, ...rest];
const triples = (a, b, c) => [a, b, c];
const quadruples = (a, b, c, d) => [a, b, c, d];
const quadruplesRest = (a, b, c, d, ...rest) => [a, b, c, d, ...rest];
const long = (a, b, c, d, e, f, g, h, i, j) => a + b + c + d + e + f + g + h + i + j;
const mapSimple = (iteratee, collection) => collection.map(iteratee);
const pow = (y, x) => x ** y;
const point = (x, y) => ({ x, y });
const foo = () => 'foo';

const object = {
  foo(five, four) {
    return { this: this, five, four };
  },
  bar(a, b, c) {
    return [this, a, b, c];
  },
};

/**
 * This is the data set used to execute "tests".
 * @type {Array<Object>}
 */
const TEST_DATA = [
  {
    label: 'Curry Function Creation: curry((a, b) => [a, b])',
    result: lodash.isFunction,
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        test: () => a => b => [a, b],
      },
      {
        label: 'Kurrie',
        test: () => kurrie(pairs),
      },
      {
        label: 'Lodash',
        test: () => lodash.curry(pairs),
      },
      {
        label: 'Rambda',
        test: () => R.curry(pairs),
      },
      {
        label: 'Curry',
        test: () => curry(pairs),
      },
      {
        label: 'Kurry',
        test: () => kurry.automix(pairs),
      },
      {
        label: 'Curriable',
        test: () => curriable(pairs),
      },
    ],
  },
  {
    label: 'Noary: x() => "foo"',
    result: 'foo',
    test: x => x(),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [() => 'foo'],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(foo)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(foo)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(foo)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(foo)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(foo)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(foo)],
      },
    ],
  },
  {
    label: 'Unary: x(y) => y',
    result: 'expected',
    test: x => x('expected'),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [x => x],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(identity)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(identity)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(identity)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(identity)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(identity)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(identity)],
      },
    ],
  },
  {
    label: 'Binary: x(y)(z) => ({ y, z })',
    result: { x: 1, y: 2 },
    test: x => x(1)(2),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [x => y => ({ x, y })],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(point)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(point)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(point)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(point)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(point)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(point)],
      },
    ],
  },
  {
    label: 'Binary 2 — Full Args: x(y, z) => ({ y, z })',
    result: { x: 1, y: 2 },
    test: x => x(1, 2),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [(x, y) => ({ x, y })],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(point)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(point)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(point)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(point)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(point)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(point)],
      },
    ],
  },
  {
    label: 'Retains Context: x(5)(4) => ({ this, five: 5, four: 4 })',
    result: { this: object, five: 5, four: 4 },
    test: x => x(5)(4),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [function first(five) {
          const self = this;

          return function second(four) {
            return { this: self, five, four };
          };
        }.bind(object)],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(object.foo.bind(object))],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(object.foo.bind(object))],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(object.foo.bind(object))],
      },
      {
        label: 'Curry',
        prepare: () => [curry(object.foo.bind(object))],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(object.foo.bind(object))],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(object.foo.bind(object))],
      },
    ],
  },
  {
    label: 'Retains Context #2: x(1)(2)(3) => [this, 1, 2, 3]',
    result: [object, 1, 2, 3],
    test: x => x(1)(2)(3),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [function first(a) {
          const self = this;

          return function second(b) {
            return function third(c) {
              return [self, a, b, c];
            };
          };
        }.bind(object)],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(object.bar.bind(object))],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(object.bar.bind(object))],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(object.bar.bind(object))],
      },
      {
        label: 'Curry',
        prepare: () => [curry(object.bar.bind(object))],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(object.bar.bind(object))],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(object.bar.bind(object))],
      },
    ],
  },
  {
    label: 'Called Without Arguments: x()()()(y) => y',
    result: 'expected',
    test: x => x()()()('expected'),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          () => () => () => y => y,
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(identity)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(identity)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(identity)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(identity)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(identity)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(identity)],
      },
    ],
  },
  {
    label: 'Called Without Arguments #2: x()(y)()(z)()(p)()(q) => [y, z, p, q]',
    result: [1, 2, 3, 4],
    test: x => x()(1)()(2)()(3)()(4),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          () => y => () => z => () => p => () => q => [y, z, p, q],
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(quadruples)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(quadruples)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(quadruples)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Summing: add(1)(2) => 3',
    result: 3,
    test: add => add(1)(2),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [a => b => a + b],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(sum)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(sum)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(sum)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(sum)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(sum)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(sum)],
      },
    ],
  },
  {
    label: 'Multi-Curry: map(pow(2))([1, 2, 3, 4, 5, 6])',
    result: [1, 4, 9, 16, 25, 36],
    test: (m, p) => m(p(2))([1, 2, 3, 4, 5, 6]),
    skip: false,
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    label: 'Multi-Curry x2: map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
    result: [1, 16, 81, 256, 625, 1296],
    skip: false,
    test: (m, p) => {
      const mp = m(p(2));
      return mp(mp([1, 2, 3, 4, 5, 6]));
    },
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    label: 'Multi-Curry x3: map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
    result: [1, 16, 81, 256, 625, 1296],
    skip: false,
    test: (m, p) => m(p(2))(m(p(2))([1, 2, 3, 4, 5, 6])),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    label: 'Trinary 1: triples(1)(2)(3) => [1, 2, 3]',
    skip: false,
    result: [1, 2, 3],
    test: trip => trip(1)(2)(3),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [a => b => c => [a, b, c]],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(triples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(triples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(triples)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(triples)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(triples)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(triples)],
      },
    ],
  },
  {
    label: 'Trinary 2: triples(1)(2, 3) => [1, 2, 3]',
    skip: false,
    result: [1, 2, 3],
    test: trip => trip(1)(2, 3),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [a => (b, c) => [a, b, c]],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(triples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(triples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(triples)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(triples)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(triples)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(triples)],
      },
    ],
  },
  {
    label: 'Quadernary 1: quadruples(1)(2)(3)(4) => [1, 2, 3, 4]',
    result: [1, 2, 3, 4],
    skip: false,
    test: quad => quad(1)(2)(3)(4),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [a => b => c => d => [a, b, c, d]],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(quadruples)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(quadruples)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(quadruples)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Lots of Arguments: add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2) => 20',
    result: 20,
    skip: false,
    test: add => add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [a => b => c => d => e => f => g => h => i => j => (
          a + b + c + d + e + f + g + h + i + j
        )],
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie(long)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry(long)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry(long)],
      },
      {
        label: 'Curry',
        prepare: () => [curry(long)],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix(long)],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable(long)],
      },
    ],
  },
  {
    label: 'Placeholders #1: add(_, 2)(1) => 3',
    result: 3,
    skip: false,
    test: (p, add) => add(p, 2)(1),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [null, (_1, x) => y => x + y],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(sum)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(sum)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(sum)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(sum)],
      },
    ],
  },
  {
    label: 'Placeholders #2: quadruples(_, 2)(_, 3)(_, 4)(1) => [1, 2, 3, 4]',
    result: [1, 2, 3, 4],
    skip: false,
    test: (p, quads) => quads(p, 2)(p, 3)(p, 4)(1),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [null, (_1, x) => (_2, y) => (_3, z) => q => [q, x, y, z]],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Placeholders #3: quadruples(_, _, _, 4)(_, _, 3)(_, 2)(1) => [1, 2, 3, 4]',
    result: [1, 2, 3, 4],
    skip: false,
    test: (p, quads) => quads(p, p, p, 4)(p, p, 3)(p, 2)(1),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [null, (_1, _2, _3, x) => (_4, _5, y) => (_6, z) => q => [q, z, y, x]],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Placeholders #4: quadruples(_, _, _, 4)(_, _, 3, _)(_, 2, _)(1, _) => [1, 2, 3, 4]',
    result: [1, 2, 3, 4],
    skip: false,
    test: (p, quads) => quads(p, p, p, 4)(p, p, 3, p)(p, 2, p)(1, p),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [null, (_1, _2, _3, x) => (
          // eslint-disable-next-line no-unused-vars
          (_4, _5, y, _6) => (_7, z, _8) => (q, _9) => [q, z, y, x]
        )],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Placeholders #5: quadruples(1, 2, 3, _, _, _, _, _)(_, 4)(4) => [1, 2, 3, 4]',
    result: [1, 2, 3, 4],
    skip: false,
    test: (p, quads) => quads(1, 2, 3, p, p, p, p, p)(p, 4)(4),
    tests: [
      {
        label: 'Vanilla',
        // eslint-disable-next-line no-unused-vars
        prepare: () => [null, (x, y, z, _1, _2, _3, _4, _5) => (_6, _7) => q => [x, y, z, q],
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(quadruples)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    label: 'Check for Leaky Placeholders 2: pairsRest(1, 2, 3, _, 4) => [1, 2, 3, 4]',
    result: (result) => {
      assert(!result.find(x => typeof x !== 'number') && result.length === 5);
      return isEqual(result, [1, 2, 3, undefined, 4]);
    },
    skip: false,
    test: (p, prs) => prs(1, 2, 3, p, 4),
    tests: [
      {
        label: 'Vanilla',
        // eslint-disable-next-line no-unused-vars
        prepare: () => [null, (a, b, c, _1, d) => [a, b, c, undefined, d]],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(pairsRest)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(pairsRest)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(pairsRest)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(pairsRest)],
      },
    ],
  },
  {
    label: 'Check for Leaky Placeholders 2: quadruplesRest(1, 2, 3, _, _, _, _, _)(_, 4)(4, _, _) => [1, 2, 3, 4]',
    result: (result) => {
      assert(!result.find(x => typeof x !== 'number') && result.length === 5);
      return isEqual(result, [1, 2, 3, 4, 4]);
    },
    skip: false,
    test: (p, quads) => quads(1, 2, 3, p, p, p, p, p)(p, 4)(4, p, p),
    tests: [
      {
        label: 'Vanilla',
        prepare: () => [
          null,
          // eslint-disable-next-line no-unused-vars
          (x, y, z, _1, _2, _3, _4, _5) => (_6, _7) => (q, _8, _9) => [x, y, z, q, _7],
        ],
      },
      {
        label: 'Kurrie',
        prepare: () => [_, kurrie(quadruplesRest)],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruplesRest)],
      },
      {
        label: 'Rambda',
        prepare: () => [R.__, R.curry(quadruplesRest)],
      },
      {
        label: 'Curry',
        isUnsupported: true,
      },
      {
        label: 'Kurry',
        isUnsupported: true,
      },
      {
        label: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruplesRest)],
      },
    ],
  },
  {
    label: 'Currying A Curried Function: curry(curry(curry(curry(pairs)))(1)))(2) => [1, 2]',
    result: [1, 2],
    skip: false,
    test: k => k(k(k(k(pairs))(1)))(2),
    tests: [
      {
        label: 'Vanilla',
        isUnsupported: true,
      },
      {
        label: 'Kurrie',
        prepare: () => [kurrie],
      },
      {
        label: 'Lodash',
        prepare: () => [lodash.curry],
      },
      {
        label: 'Rambda',
        prepare: () => [R.curry],
      },
      {
        label: 'Curry',
        prepare: () => [curry],
      },
      {
        label: 'Kurry',
        prepare: () => [kurry.automix],
      },
      {
        label: 'Curriable',
        prepare: () => [curriable],
      },
    ],
  },
];

const isActiveTest = ({ skip }) => !skip;

function printOperationsPerSecond() {
  log('%s\n', bold('[Operations Per Second]'));

  const totalOps = {};
  const totalTime = {};

  each(TOTALS, (group) => {
    each(group, ({ valid, duration }, library) => {
      totalTime[library] = (totalTime[library] || 0) + duration;
      if (valid) totalOps[library] = (totalOps[library] || 0) + TEST_ITERATIONS;
    });
  });

  each(totalTime, (value, library) => {
    totalOps[library] = (totalOps[library] / value) * 1000;
  });

  const ranked = toRanked(totalOps);
  const baseline = ranked.Vanilla.value;

  each(ranked, ({ value, color }, library) => {
    const variance = padStart(Math.trunc(Math.abs(value / baseline * 100)), 4);
    log('%s %s %s', flabel(library), color(padStart(Math.round(value).toLocaleString(), 10)), dim(variance.concat('%')));
  });
}

const combineAttributes = kurrie((testSettings, librarySettings) => ({
  ...testSettings,
  ...librarySettings,
  group: testSettings.label,
}));

function executeTests({ tests, ...testSettings }) {
  log(bold(`Test \`${testSettings.label}\` [x${TEST_ITERATIONS.toLocaleString()}]\n`));
  const results = map(invokeTest)(map(combineAttributes(testSettings))(tests));
  const ranked = toRanked(keyBy(results, 'library'), 'duration', false);

  each(ranked, ({
    key,
    value,
    color,
    message,
  }) => {
    log('%s %s', flabel(key), message || color(value.toLocaleString().concat('ms')));
  });

  log('\n');
}

(function main() {
  map(executeTests)(filter(isActiveTest, TEST_DATA));
  printOperationsPerSecond();
  log('\n');
}());
