'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _rambda = require('rambda');

var _rambda2 = _interopRequireDefault(_rambda);

var _curry = require('curry');

var _curry2 = _interopRequireDefault(_curry);

var _kurry = require('kurry');

var _kurry2 = _interopRequireDefault(_kurry);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _curriable = require('curriable');

var _curriable2 = _interopRequireDefault(_curriable);

var _chalk = require('chalk');

var _10 = require('.');

var _11 = _interopRequireDefault(_10);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var get = _lodash2.default.get,
    each = _lodash2.default.each,
    keyBy = _lodash2.default.keyBy,
    isEqual = _lodash2.default.isEqual,
    padStart = _lodash2.default.padStart,
    identity = _lodash2.default.identity,
    stubArray = _lodash2.default.stubArray,
    isFunction = _lodash2.default.isFunction;
var _console = console,
    log = _console.log;

var map = _11.default.proto(Array.prototype.map);
var filter = _11.default.proto(Array.prototype.filter);
var flabel = function flabel(label) {
  return (label === 'Vanilla' ? _chalk.dim : _chalk.cyan)(padStart(label, 9));
};

var TOTALS = {};
var TEST_ITERATIONS = 1e6;

function invokeAMillionTimes(fn, result, args) {
  var check = isFunction(result) ? result : isEqual;

  return function () {
    for (var i = 0; i < TEST_ITERATIONS; i++) {
      (0, _assert2.default)(check(fn.apply(undefined, _toConsumableArray(args)), result));
    }
  };
}

function executeSingleTest(operation) {
  var duration = NaN;
  var message = null;
  var start = Date.now();

  try {
    operation();
    duration = Date.now() - start;
  } catch (e) {
    if (e.code === 'ERR_ASSERTION') {
      message = (0, _chalk.magenta)('[Invalid Results]');
    } else {
      message = (0, _chalk.red)('[Error: ' + e.message + ']');
    }
  }

  return {
    duration: duration,
    message: message
  };
}

var colors = [_chalk.dim, _chalk.green, identity, identity, _chalk.yellow, _chalk.yellow, _chalk.red];

function total(group, test, duration) {
  TOTALS[group] = TOTALS[group] || {};
  TOTALS[group][test] = (TOTALS[group][test] || 0) + duration;
}

function toRanked(collection, attribute) {
  var reverse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var array = _lodash2.default.map(collection, function (value, key) {
    return _extends({}, value, {
      key: key,
      value: get(value, attribute, value)
    });
  });

  var sorted = array.sort(function (a, b) {
    if (a.key === 'Vanilla') return reverse ? 1 : -1;
    return a.value - b.value;
  });

  if (reverse) sorted.reverse();
  var data = sorted.map(function (props, rank) {
    return _extends({}, props, { rank: rank, color: colors[rank] });
  });
  return keyBy(data, 'key');
}

function invokeTestAndLogResults(_ref) {
  var test = _ref.test,
      label = _ref.label,
      result = _ref.result,
      _ref$prepare = _ref.prepare,
      prepare = _ref$prepare === undefined ? stubArray : _ref$prepare,
      isUnsupported = _ref.isUnsupported,
      group = _ref.group;

  if (isUnsupported) {
    return {
      library: label,
      duration: NaN,
      message: (0, _chalk.yellow)('[Unsupported]')
    };
  }

  var results = executeSingleTest(invokeAMillionTimes(test, result, prepare()));
  total(group, label, results.duration);

  return _extends({}, results, {
    library: label
  });
}

var sum = function sum(a, b) {
  return a + b;
};
var pairs = function pairs(a, b) {
  return [a, b];
};
var triples = function triples(a, b, c) {
  return [a, b, c];
};
var quadruples = function quadruples(a, b, c, d) {
  return [a, b, c, d];
};
var long = function long(a, b, c, d, e, f, g, h, i, j) {
  return a + b + c + d + e + f + g + h + i + j;
};
var mapSimple = function mapSimple(iteratee, collection) {
  return collection.map(iteratee);
};
var pow = function pow(y, x) {
  return Math.pow(x, y);
};
var point = function point(x, y) {
  return { x: x, y: y };
};

var TEST_DATA = [{
  label: 'Curry Function Creation: curry((a, b) => [a, b])',
  result: _lodash2.default.isFunction,
  tests: [{
    label: 'Vanilla',
    test: function test() {
      return function (a) {
        return function (b) {
          return [a, b];
        };
      };
    }
  }, {
    label: 'Kurrie',
    test: function test() {
      return (0, _11.default)(pairs);
    }
  }, {
    label: 'Lodash',
    test: function test() {
      return _lodash2.default.curry(pairs);
    }
  }, {
    label: 'Rambda',
    test: function test() {
      return _rambda2.default.curry(pairs);
    }
  }, {
    label: 'Curry',
    test: function test() {
      return (0, _curry2.default)(pairs);
    }
  }, {
    label: 'Kurry',
    test: function test() {
      return _kurry2.default.automix(pairs);
    }
  }, {
    label: 'Curriable',
    test: function test() {
      return (0, _curriable2.default)(pairs);
    }
  }]
}, {
  label: 'x(y) => y',
  result: 'expected',
  test: function test(x) {
    return x('expected');
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (x) {
        return x;
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(identity)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(identity)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(identity)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(identity)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(identity)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(identity)];
    }
  }]
}, {
  label: 'x(y)(z) => ({ y, z })',
  result: { x: 1, y: 2 },
  test: function test(x) {
    return x(1)(2);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (x) {
        return function (y) {
          return { x: x, y: y };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(point)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(point)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(point)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(point)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(point)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(point)];
    }
  }]
}, {
  label: 'x()()()(y) => y',
  result: 'expected',
  test: function test(x) {
    return x()()()('expected');
  },
  skip: false,
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function () {
        return function () {
          return function () {
            return function (y) {
              return y;
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(identity)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(identity)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(identity)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(identity)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(identity)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(identity)];
    }
  }]
}, {
  label: 'add(1)(2) => 3',
  result: 3,
  test: function test(add) {
    return add(1)(2);
  },
  skip: false,
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (a) {
        return function (b) {
          return a + b;
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(sum)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(sum)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(sum)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(sum)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(sum)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(sum)];
    }
  }]
}, {
  label: 'map(pow(2))([1, 2, 3, 4, 5, 6])',
  result: [1, 4, 9, 16, 25, 36],
  test: function test(m, p) {
    return m(p(2))([1, 2, 3, 4, 5, 6]);
  },
  skip: false,
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (iteratee) {
        return function (collection) {
          return collection.map(iteratee);
        };
      }, function (y) {
        return function (x) {
          return Math.pow(x, y);
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(mapSimple), (0, _11.default)(pow)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(mapSimple), _lodash2.default.curry(pow)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(mapSimple), _rambda2.default.curry(pow)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(mapSimple), (0, _curry2.default)(pow)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(mapSimple), _kurry2.default.automix(pow)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(mapSimple), (0, _curriable2.default)(pow)];
    }
  }]
}, {
  label: 'map(pow(2))(map(pow(2))([1, 2, 3, 4, 5, 6]))',
  result: [1, 16, 81, 256, 625, 1296],
  skip: false,
  test: function test(m, p) {
    var mp = m(p(2));
    return mp(mp([1, 2, 3, 4, 5, 6]));
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (iteratee) {
        return function (collection) {
          return collection.map(iteratee);
        };
      }, function (y) {
        return function (x) {
          return Math.pow(x, y);
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(mapSimple), (0, _11.default)(pow)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(mapSimple), _lodash2.default.curry(pow)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(mapSimple), _rambda2.default.curry(pow)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(mapSimple), (0, _curry2.default)(pow)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(mapSimple), _kurry2.default.automix(pow)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(mapSimple), (0, _curriable2.default)(pow)];
    }
  }]
}, {
  label: 'triples(1)(2)(3) => [1, 2, 3]',
  skip: false,
  result: [1, 2, 3],
  test: function test(trip) {
    return trip(1)(2)(3);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (a) {
        return function (b) {
          return function (c) {
            return [a, b, c];
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(triples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(triples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(triples)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(triples)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(triples)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(triples)];
    }
  }]
}, {
  label: 'quadruples(1)(2)(3)(4) => [1, 2, 3, 4]',
  result: [1, 2, 3, 4],
  skip: false,
  test: function test(quad) {
    return quad(1)(2)(3)(4);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (a) {
        return function (b) {
          return function (c) {
            return function (d) {
              return [a, b, c, d];
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(quadruples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(quadruples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(quadruples)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(quadruples)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(quadruples)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(quadruples)];
    }
  }]
}, {
  label: 'add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2) => 20',
  result: 20,
  skip: false,
  test: function test(add) {
    return add(2)(2)(2)(2)(2)(2)(2)(2)(2)(2);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [function (a) {
        return function (b) {
          return function (c) {
            return function (d) {
              return function (e) {
                return function (f) {
                  return function (g) {
                    return function (h) {
                      return function (i) {
                        return function (j) {
                          return a + b + c + d + e + f + g + h + i + j;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [(0, _11.default)(long)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default.curry(long)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.curry(long)];
    }
  }, {
    label: 'Curry',
    prepare: function prepare() {
      return [(0, _curry2.default)(long)];
    }
  }, {
    label: 'Kurry',
    prepare: function prepare() {
      return [_kurry2.default.automix(long)];
    }
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [(0, _curriable2.default)(long)];
    }
  }]
}, {
  label: 'add(_, 2)(1) => 3',
  result: 3,
  skip: false,
  test: function test(p, add) {
    return add(p, 2)(1);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [null, function (_1, x) {
        return function (y) {
          return x + y;
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [_10._, (0, _11.default)(sum)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default, _lodash2.default.curry(sum)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.__, _rambda2.default.curry(sum)];
    }
  }, {
    label: 'Curry',
    isUnsupported: true
  }, {
    label: 'Kurry',
    isUnsupported: true
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [_curriable2.default.__, (0, _curriable2.default)(quadruples)];
    }
  }]
}, {
  label: 'quadruples(_, 2)(_, 3)(_, 4)(1) => [1, 2, 3, 4]',
  result: [1, 2, 3, 4],
  skip: false,
  test: function test(p, quads) {
    return quads(p, 2)(p, 3)(p, 4)(1);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [null, function (_1, x) {
        return function (_2, y) {
          return function (_3, z) {
            return function (q) {
              return [q, x, y, z];
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [_10._, (0, _11.default)(quadruples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default, _lodash2.default.curry(quadruples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.__, _rambda2.default.curry(quadruples)];
    }
  }, {
    label: 'Curry',
    isUnsupported: true
  }, {
    label: 'Kurry',
    isUnsupported: true
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [_curriable2.default.__, (0, _curriable2.default)(quadruples)];
    }
  }]
}, {
  label: 'quadruples(_, _, _, 4)(_, _, 3)(_, 2)(1) => [1, 2, 3, 4]',
  result: [1, 2, 3, 4],
  skip: false,
  test: function test(p, quads) {
    return quads(p, p, p, 4)(p, p, 3)(p, 2)(1);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [null, function (_1, _2, _3, x) {
        return function (_4, _5, y) {
          return function (_6, z) {
            return function (q) {
              return [q, z, y, x];
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [_10._, (0, _11.default)(quadruples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default, _lodash2.default.curry(quadruples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.__, _rambda2.default.curry(quadruples)];
    }
  }, {
    label: 'Curry',
    isUnsupported: true
  }, {
    label: 'Kurry',
    isUnsupported: true
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [_curriable2.default.__, (0, _curriable2.default)(quadruples)];
    }
  }]
}, {
  label: 'quadruples(_, _, _, 4)(_, _, 3, _)(_, 2, _)(1, _) => [1, 2, 3, 4]',
  result: [1, 2, 3, 4],
  skip: false,
  test: function test(p, quads) {
    return quads(p, p, p, 4)(p, p, 3, p)(p, 2, p)(1, p);
  },
  tests: [{
    label: 'Vanilla',
    prepare: function prepare() {
      return [null, function (_1, _2, _3, x) {
        return function (_4, _5, y, _6) {
          return function (_7, z, _8) {
            return function (q, _9) {
              return [q, z, y, x];
            };
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [_10._, (0, _11.default)(quadruples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default, _lodash2.default.curry(quadruples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.__, _rambda2.default.curry(quadruples)];
    }
  }, {
    label: 'Curry',
    isUnsupported: true
  }, {
    label: 'Kurry',
    isUnsupported: true
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [_curriable2.default.__, (0, _curriable2.default)(quadruples)];
    }
  }]
}, {
  label: 'quadruples(1, 2, 3, _, _, _, _, _)(_, 4)(4) => [1, 2, 3, 4]',
  result: [1, 2, 3, 4],
  skip: false,
  test: function test(p, quads) {
    return quads(1, 2, 3, p, p, p, p, p)(p, 4)(4);
  },
  tests: [{
    label: 'Vanilla',

    prepare: function prepare() {
      return [null, function (x, y, z, _1, _2, _3, _4, _5) {
        return function (_6, _7) {
          return function (q) {
            return [x, y, z, q];
          };
        };
      }];
    }
  }, {
    label: 'Kurrie',
    prepare: function prepare() {
      return [_10._, (0, _11.default)(quadruples)];
    }
  }, {
    label: 'Lodash',
    prepare: function prepare() {
      return [_lodash2.default, _lodash2.default.curry(quadruples)];
    }
  }, {
    label: 'Rambda',
    prepare: function prepare() {
      return [_rambda2.default.__, _rambda2.default.curry(quadruples)];
    }
  }, {
    label: 'Curry',
    isUnsupported: true
  }, {
    label: 'Kurry',
    isUnsupported: true
  }, {
    label: 'Curriable',
    prepare: function prepare() {
      return [_curriable2.default.__, (0, _curriable2.default)(quadruples)];
    }
  }]
}];

var isActiveTest = function isActiveTest(_ref2) {
  var skip = _ref2.skip;
  return !skip;
};

function printOperationsPerSecond() {
  log('%s\n', (0, _chalk.bold)('[Operations Per Second]'));

  var totalOps = {};
  var totalTime = {};

  each(TOTALS, function (group) {
    each(group, function (duration, library) {
      if (!duration) return;
      totalTime[library] = (totalTime[library] || 0) + duration;
      totalOps[library] = (totalOps[library] || 0) + TEST_ITERATIONS;
    });
  });

  each(totalTime, function (value, library) {
    totalOps[library] = totalOps[library] / value * 1000;
  });

  var ranked = toRanked(totalOps);
  var baseline = ranked.Vanilla.value;

  console.log(totalTime, ranked);

  each(ranked, function (_ref3, library) {
    var value = _ref3.value,
        color = _ref3.color;

    var variance = padStart(Math.trunc(Math.abs(value / baseline * 100)), 4);
    log('%s %s %s', flabel(library), color(padStart(Math.round(value).toLocaleString(), 10)), (0, _chalk.dim)(variance.concat('%')));
  });
}

var combineAttributes = (0, _11.default)(function (testSettings, librarySettings) {
  return _extends({}, testSettings, librarySettings, {
    group: testSettings.label
  });
});

function executeTests(_ref4) {
  var tests = _ref4.tests,
      testSettings = _objectWithoutProperties(_ref4, ['tests']);

  log((0, _chalk.bold)('Test `' + testSettings.label + '` [x' + TEST_ITERATIONS.toLocaleString() + ']\n'));
  var results = map(invokeTestAndLogResults)(map(combineAttributes(testSettings))(tests));
  var ranked = toRanked(keyBy(results, 'library'), 'duration', false);

  each(ranked, function (_ref5) {
    var key = _ref5.key,
        value = _ref5.value,
        color = _ref5.color,
        message = _ref5.message;

    log('%s %s', flabel(key), message || color(value.toLocaleString().concat('ms')));
  });

  log('\n');
}

(function main() {
  map(executeTests)(filter(isActiveTest, TEST_DATA));
  printOperationsPerSecond();
  log('\n');
})();