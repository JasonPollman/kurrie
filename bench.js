/**
 * Benchmarks kurrie vs. lodash, rambda, curried, curry, and kurrie.
 * @since 10/10/18
 * @file
 */

/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle, require-jsdoc */

const R = require('rambda');
const chalk = require('chalk');
const curry = require('curry');
const kurry = require('kurry');
const lodash = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const Benchmark = require('benchmark');
const curriable = require('curriable').default;
const kurrie = require('./dist/kurrie').default;

const { log } = console;

const {
  map,
  each,
  sortBy,
  isEqual,
  padStart,
} = lodash;

const {
  dim,
  red,
  cyan,
  bold,
  green,
  yellow,
} = chalk;

// Functions that will be curried for testing.
const sum = (x, y) => x + y;
const pow = (y, x) => x ** y;
const long = (a, b, c, d, e, f, g, h, i, j) => a + b + c + d + e + f + g + h + i + j;
const pairs = (x, y) => [x, y];
const point = (x, y) => ({ x, y });
const triples = (x, y, z) => [x, y, z];
const nullary = () => 'foo';
const identity = x => x;
const mapSimple = (iteratee, collection) => collection.map(iteratee);
const quadruples = (a, b, c, d) => [a, b, c, d];

const object = {
  foo(five, four) {
    return { this: this, five, four };
  },
  bar(a, b, c) {
    return [this, a, b, c];
  },
};

const colors = {
  0: dim,
  1: green,
  2: identity,
  3: identity,
  4: yellow,
  5: yellow,
  6: red,
};

const formatStat = ({ error, operations }, library) => ({
  error,
  operations,
  library,
  message: error ? `[Error: ${error.message}]` : null,
});

const flabel = label => bold(cyan(padStart(label, 11)));
const getColor = (item, i) => ({ ...item, color: item.error ? bold.red : colors[i] });
const toFixed = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const formatTotal = ({ succeeded, operations }, library) => ({ library, succeeded, operations });

function rank(results) {
  return sortBy(map(results, formatStat), ['error', 'operations']).reverse().map(getColor);
}

function rankTotals(results) {
  return sortBy(map(results, formatTotal), ['operations']).reverse().map(getColor);
}

function printTotals(stats) {
  log(bold('Average Operations Per Second:\r\n'));

  each(rankTotals(stats.total), (data) => {
    const {
      color,
      library,
      succeeded,
      operations,
    } = data;

    log('%s %s', flabel(library), color(toFixed(operations / succeeded)));
  });

  log('\r\n');
}

function handleSuiteCompleted(name, stats) {
  return () => {
    log(bold('Test: %s\r\n'), name);

    rank(stats.tests[name]).forEach((data) => {
      const {
        color,
        library,
        message,
        operations,
      } = data;

      return message
        ? log('%s %s', flabel(library), color(message))
        : log('%s %s', flabel(library), color(toFixed(operations)));
    });

    log('\r\n');
  };
}

function handleCycleCompleted(stats) {
  return ({ target }) => {
    const { hz, name, error } = target;
    const [suite, library] = name.split(/::/);

    /* eslint-disable no-param-reassign */
    stats.tests = stats.tests || {};
    stats.total = stats.total || {};

    stats.tests[suite] = stats.tests[suite] || {};
    stats.tests[suite][library] = {
      error,
      operations: hz || NaN,
    };

    stats.total[library] = stats.total[library] || {};
    stats.total[library].operations = stats.total[library].operations || 0;
    stats.total[library].succeeded = stats.total[library].succeeded || 0;

    stats.total[library].operations += hz;
    stats.total[library].succeeded += error ? 0 : 1;
    /* eslint-enable no-param-reassign */
  };
}

async function run(stats, suites) {
  await Promise.map(suites, (suiteSettings) => {
    const {
      name,
      skip,
    } = suiteSettings;

    if (skip) return Promise.resolve();
    const suite = new Benchmark.Suite();

    suiteSettings.tests.forEach((settings) => {
      const options = { ...suiteSettings, ...settings };

      const {
        test,
        library,
        prepare = () => [],
        validate = () => true,
        isUnsupported,
      } = options;

      if (isUnsupported) return;
      const prepared = prepare();

      suite.add(`${name}::${library}`, () => {
        assert(validate(test(...prepared)));
      });
    });

    return new Promise(resolve => suite
      .on('cycle', handleCycleCompleted(stats))
      .on('complete', handleSuiteCompleted(name, stats))
      .on('complete', resolve)
      .run({ async: true }),
    );
  });

  return stats;
}

const config = [
  {
    name: 'Curry Function Creation: fn((a, b) => [a, b])',
    skip: false,
    validate: result => typeof result === 'function',
    tests: [
      {
        library: 'Vanilla',
        test: () => a => b => [a, b],
      },
      {
        library: 'Kurrie',
        test: () => kurrie(pairs),
      },
      {
        library: 'Lodash',
        test: () => lodash.curry(pairs),
      },
      {
        library: 'Rambda',
        test: () => R.curry(pairs),
      },
      {
        library: 'Curry',
        test: () => curry(pairs),
      },
      {
        library: 'Kurry',
        test: () => kurry.automix(pairs),
      },
      {
        library: 'Curriable',
        test: () => curriable(pairs),
      },
    ],
  },
  {
    name: 'Nullary: fn() => "foo"',
    skip: false,
    validate: result => result === 'foo',
    test: fn => fn(),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [() => 'foo'],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(nullary)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(nullary)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(nullary)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(nullary)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(nullary)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(nullary)],
      },
    ],
  },
  {
    name: 'Unary: fn(x) => x',
    skip: false,
    test: fn => fn(5),
    validate: x => x === 5,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [x => x],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(identity)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(identity)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(identity)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(identity)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(identity)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(identity)],
      },
    ],
  },
  {
    name: 'Binary: fn(x)(y) => ({ x, y })',
    validate: results => isEqual(results, { x: 1, y: 2 }),
    test: x => x(1)(2),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [x => y => ({ x, y })],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(point)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(point)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(point)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(point)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(point)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(point)],
      },
    ],
  },
  {
    name: 'Binary, Full Args: fn(x, y) => ({ x, y })',
    validate: results => isEqual(results, { x: 1, y: 2 }),
    test: x => x(1, 2),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [(x, y) => ({ x, y })],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(point)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(point)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(point)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(point)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(point)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(point)],
      },
    ],
  },
  {
    name: 'Retains Context: fn(5)(4) => ({ this, five: 5, four: 4 })',
    validate: result => isEqual(result, { this: object, five: 5, four: 4 }),
    test: x => x(5)(4),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [function first(five) {
          const self = this;

          return function second(four) {
            return { this: self, five, four };
          };
        }.bind(object)],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(object.foo.bind(object))],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(object.foo.bind(object))],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(object.foo.bind(object))],
      },
      {
        library: 'Curry',
        prepare: () => [curry(object.foo.bind(object))],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(object.foo.bind(object))],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(object.foo.bind(object))],
      },
    ],
  },
  {
    name: 'Retains Context #2: x(1)(2)(3) => [this, 1, 2, 3]',
    result: [object, 1, 2, 3],
    test: x => x(1)(2)(3),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
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
        library: 'Kurrie',
        prepare: () => [kurrie(object.bar.bind(object))],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(object.bar.bind(object))],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(object.bar.bind(object))],
      },
      {
        library: 'Curry',
        prepare: () => [curry(object.bar.bind(object))],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(object.bar.bind(object))],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(object.bar.bind(object))],
      },
    ],
  },
  {
    name: 'Called Without Arguments: fn()()()(x) => x',
    result: result => isEqual(result, 'expected'),
    test: x => x()()()('expected'),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          () => () => () => y => y,
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(identity)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(identity)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(identity)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(identity)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(identity)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(identity)],
      },
    ],
  },
  {
    name: 'Called Without Arguments #2: x()(y)()(z)()(p)()(q) => [y, z, p, q]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    test: x => x()(1)()(2)()(3)()(4),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          () => y => () => z => () => p => () => q => [y, z, p, q],
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(quadruples)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(quadruples)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(quadruples)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Summing: add(1)(2) => 3',
    result: result => result === 3,
    test: add => add(1)(2),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [a => b => a + b],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(sum)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(sum)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(sum)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(sum)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(sum)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(sum)],
      },
    ],
  },
  {
    name: 'Multi-Curry: map(pow(2))([1, 2, 3, 4, 5, 6])',
    result: result => isEqual(result, [1, 4, 9, 16, 25, 36]),
    test: (m, p) => m(p(2))([1, 2, 3, 4, 5, 6]),
    skip: false,
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    name: 'Multi-Curry x2: map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
    result: result => isEqual(result, [1, 16, 81, 256, 625, 1296]),
    skip: false,
    test: (m, p) => {
      const mp = m(p(2));
      return mp(mp([1, 2, 3, 4, 5, 6]));
    },
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    name: 'Multi-Curry x3: map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
    result: result => isEqual(result, [1, 16, 81, 256, 625, 1296]),
    skip: false,
    test: (m, p) => m(p(2))(m(p(2))([1, 2, 3, 4, 5, 6])),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          iteratee => collection => collection.map(iteratee),
          y => x => x ** y,
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(mapSimple), kurrie(pow)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(mapSimple), R.curry(pow)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(mapSimple), curry(pow)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(mapSimple), kurry.automix(pow)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    name: 'Multi-Curry x4: map(pow(_, 2))(map(pow(_, 2))([1, 2, 3, 4, 5, 6]))',
    result: result => isEqual(result, [4, 16, 256, 65536]),
    skip: false,
    test: (__, m, p) => m(p(__, 2))(m(p(__, 2))([1, 2, 3, 4])),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [
          null,
          iteratee => collection => collection.map(iteratee),
          (__1, x) => y => x ** y,
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(mapSimple), kurrie(pow)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(mapSimple), lodash.curry(pow)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(mapSimple), R.curry(pow)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(mapSimple), curriable(pow)],
      },
    ],
  },
  {
    name: 'Trinary 1: triples(1)(2)(3) => [1, 2, 3]',
    skip: false,
    result: result => isEqual(result, [1, 2, 3]),
    test: trip => trip(1)(2)(3),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [a => b => c => [a, b, c]],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(triples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(triples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(triples)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(triples)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(triples)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(triples)],
      },
    ],
  },
  {
    name: 'Trinary 2: triples(1)(2, 3) => [1, 2, 3]',
    skip: false,
    result: result => isEqual(result, [1, 2, 3]),
    test: trip => trip(1)(2, 3),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [a => (b, c) => [a, b, c]],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(triples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(triples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(triples)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(triples)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(triples)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(triples)],
      },
    ],
  },
  {
    name: 'Quadernary 1: quadruples(1)(2)(3)(4) => [1, 2, 3, 4]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    skip: false,
    test: quad => quad(1)(2)(3)(4),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [a => b => c => d => [a, b, c, d]],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(quadruples)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(quadruples)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(quadruples)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Lots of Arguments: add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2) => 20',
    result: result => result === 20,
    skip: false,
    test: add => add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [a => b => c => d => e => f => g => h => i => j => (
          a + b + c + d + e + f + g + h + i + j
        )],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(long)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(long)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(long)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(long)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(long)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(long)],
      },
    ],
  },
  {
    name: 'Lots of Arguments #2: add(2, 2, 2, 2)(2, 2, 2, 2, 2)(2) => 20',
    result: result => result === 20,
    skip: false,
    test: add => add(2, 2, 2, 2)(2, 2, 2, 2, 2)(2),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [(a, b, c, d) => (e, f, g, h, i) => j => (
          a + b + c + d + e + f + g + h + i + j
        )],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(long)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(long)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(long)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(long)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(long)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(long)],
      },
    ],
  },
  {
    name: 'Lots of Arguments #3: add(2, 2, 2, 2, 2, 2, 2, 2, 2, 2) => 20',
    result: result => result === 20,
    skip: false,
    test: add => add(2, 2, 2, 2, 2, 2, 2, 2, 2, 2),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [(a, b, c, d, e, f, g, h, i, j) => (
          a + b + c + d + e + f + g + h + i + j
        )],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie(long)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry(long)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry(long)],
      },
      {
        library: 'Curry',
        prepare: () => [curry(long)],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix(long)],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable(long)],
      },
    ],
  },
  {
    name: 'Placeholders #1: add(_, 2)(1) => 3',
    result: result => result === 3,
    skip: false,
    test: (p, add) => add(p, 2)(1),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [null, (_1, x) => y => x + y],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(sum)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(sum)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(sum)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(sum)],
      },
    ],
  },
  {
    name: 'Placeholders #2: quadruples(_, 2)(_, 3)(_, 4)(1) => [1, 2, 3, 4]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    skip: false,
    test: (p, quads) => quads(p, 2)(p, 3)(p, 4)(1),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [null, (_1, x) => (_2, y) => (_3, z) => q => [q, x, y, z]],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Placeholders #3: quadruples(_, _, _, 4)(_, _, 3)(_, 2)(1) => [1, 2, 3, 4]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    skip: false,
    test: (p, quads) => quads(p, p, p, 4)(p, p, 3)(p, 2)(1),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [null, (_1, _2, _3, x) => (_4, _5, y) => (_6, z) => q => [q, z, y, x]],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Placeholders #4: quadruples(_, _, _, 4)(_, _, 3, _)(_, 2, _)(1, _) => [1, 2, 3, 4]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    skip: false,
    test: (p, quads) => quads(p, p, p, 4)(p, p, 3, p)(p, 2, p)(1, p),
    tests: [
      {
        library: 'Vanilla',
        prepare: () => [null, (_1, _2, _3, x) => (
          // eslint-disable-next-line no-unused-vars
          (_4, _5, y, _6) => (_7, z, _8) => (q, _9) => [q, z, y, x]
        )],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Placeholders #5: quadruples(1, 2, 3, _, _, _, _, _)(_, 4)(4) => [1, 2, 3, 4]',
    result: result => isEqual(result, [1, 2, 3, 4]),
    skip: false,
    test: (p, quads) => quads(1, 2, 3, p, p, p, p, p)(p, 4)(4),
    tests: [
      {
        library: 'Vanilla',
        // eslint-disable-next-line no-unused-vars
        prepare: () => [null, (x, y, z, _1, _2, _3, _4, _5) => (_6, _7) => q => [x, y, z, q],
        ],
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie._, kurrie(quadruples)],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash, lodash.curry(quadruples)],
      },
      {
        library: 'Rambda',
        prepare: () => [R.__, R.curry(quadruples)],
      },
      {
        library: 'Curry',
        isUnsupported: true,
      },
      {
        library: 'Kurry',
        isUnsupported: true,
      },
      {
        library: 'Curriable',
        prepare: () => [curriable.__, curriable(quadruples)],
      },
    ],
  },
  {
    name: 'Currying A Curried Function: curry(curry(curry(curry(pairs)))(1)))(2) => [1, 2]',
    result: result => isEqual(result, [1, 2]),
    skip: false,
    test: k => k(k(k(k(pairs))(1)))(2),
    tests: [
      {
        library: 'Vanilla',
        isUnsupported: true,
      },
      {
        library: 'Kurrie',
        prepare: () => [kurrie],
      },
      {
        library: 'Lodash',
        prepare: () => [lodash.curry],
      },
      {
        library: 'Rambda',
        prepare: () => [R.curry],
      },
      {
        library: 'Curry',
        prepare: () => [curry],
      },
      {
        library: 'Kurry',
        prepare: () => [kurry.automix],
      },
      {
        library: 'Curriable',
        prepare: () => [curriable],
      },
    ],
  },
];

run({}, config).then(printTotals).catch(e => log(e.stack));
