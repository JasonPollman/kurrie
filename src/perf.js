/**
 * Performance tests comparing kurrie to other popular currying libraries.
 * The packages listed below aren't listed in the package.json and you must
 * install them yourself.
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
  magenta,
} from 'chalk';

import kurrie, { _ } from '.';

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
const TEST_ITERATIONS = 1e6;

function invokeAMillionTimes(fn, result, args) {
  const check = isFunction(result) ? result : isEqual;

  return () => {
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      assert(check(fn(...args), result));
    }
  };
}

function executeSingleTest(operation) {
  let duration = NaN;
  let message = null;
  const start = Date.now();

  try {
    operation();
    duration = Date.now() - start;
  } catch (e) {
    if (e.code === 'ERR_ASSERTION') {
      message = magenta('[Invalid Results]');
    } else {
      message = red(`[Error: ${e.message}]`);
    }
  }

  return {
    duration,
    message,
  };
}

const colors = [dim, green, identity, identity, yellow, yellow, red];

function total(group, test, duration) {
  TOTALS[group] = TOTALS[group] || {};
  TOTALS[group][test] = (TOTALS[group][test] || 0) + duration;
}

function toRanked(collection, attribute, reverse = true) {
  const array = lodash.map(collection, (value, key) => ({
    ...value,
    key,
    value: get(value, attribute, value),
  }));

  const sorted = array.sort((a, b) => {
    if (a.key === 'Vanilla') return reverse ? 1 : -1;
    return a.value - b.value;
  });

  if (reverse) sorted.reverse();
  const data = sorted.map((props, rank) => ({ ...props, rank, color: colors[rank] }));
  return keyBy(data, 'key');
}

function invokeTestAndLogResults({
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
      duration: NaN,
      message: yellow('[Unsupported]'),
    };
  }

  const results = executeSingleTest(invokeAMillionTimes(test, result, prepare()));
  total(group, label, results.duration);

  return {
    ...results,
    library: label,
  };
}

// Functions to be curried by the tests below...
const sum = (a, b) => a + b;
const pairs = (a, b) => [a, b];
const triples = (a, b, c) => [a, b, c];
const quadruples = (a, b, c, d) => [a, b, c, d];
const long = (a, b, c, d, e, f, g, h, i, j) => a + b + c + d + e + f + g + h + i + j;
const mapSimple = (iteratee, collection) => collection.map(iteratee);
const pow = (y, x) => x ** y;
const point = (x, y) => ({ x, y });

/**
 * This is the data set used to execute "tests".
 * @type {Array<Object>}
 */
const TEST_DATA = [
  {
    label: 'Curry Function Creation: curry((a, b) => [a, b])',
    result: lodash.isFunction,
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
    label: 'x(y) => y',
    result: 'expected',
    test: x => x('expected'),
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
    label: 'x(y)(z) => ({ y, z })',
    result: { x: 1, y: 2 },
    test: x => x(1)(2),
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
    label: 'x()()()(y) => y',
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
    label: 'add(1)(2) => 3',
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
    label: 'map(pow(2))([1, 2, 3, 4, 5, 6])',
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
    label: 'map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
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
    label: 'triples(1)(2)(3) => [1, 2, 3]',
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
    label: 'quadruples(1)(2)(3)(4) => [1, 2, 3, 4]',
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
    label: 'add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2) => 20',
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
    label: 'add(_, 2)(1) => 3',
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
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    label: 'quadruples(_, 2)(_, 3)(_, 4)(1) => [1, 2, 3, 4]',
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
    label: 'quadruples(_, _, _, 4)(_, _, 3)(_, 2)(1) => [1, 2, 3, 4]',
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
    label: 'quadruples(_, _, _, 4)(_, _, 3, _)(_, 2, _)(1, _) => [1, 2, 3, 4]',
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
    label: 'quadruples(1, 2, 3, _, _, _, _, _)(_, 4)(4) => [1, 2, 3, 4]',
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
];

const isActiveTest = ({ skip }) => !skip;

function printOperationsPerSecond() {
  log('%s\n', bold('[Operations Per Second]'));

  const totalOps = {};
  const totalTime = {};

  each(TOTALS, (group) => {
    each(group, (duration, library) => {
      if (!duration) return;
      totalTime[library] = (totalTime[library] || 0) + duration;
      totalOps[library] = (totalOps[library] || 0) + TEST_ITERATIONS;
    });
  });

  each(totalTime, (value, library) => {
    totalOps[library] = (totalOps[library] / value) * 1000;
  });

  const ranked = toRanked(totalOps);
  const baseline = ranked.Vanilla.value;

  console.log(totalTime, ranked);

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
  const results = map(invokeTestAndLogResults)(map(combineAttributes(testSettings))(tests));
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
