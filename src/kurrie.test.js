import {
  assert,
  expect,
} from 'chai';

import kurrie, {
  _,
  __,
  uncurry,
  curryTo,
  isCurried,
  curryProto,
  getSourceFunction,
} from './kurrie';

const TO_STRING_MATCH = /^\/\* Wrapped with kurrie \*\/\r\n/;

describe('kurrie', () => {
  describe('Default export', () => {
    it('Should be a function', () => {
      expect(kurrie).to.be.a('function');
    });

    it('Should alter the curried function\'s `toString` method', () => {
      const source = x => x;
      expect(kurrie(source).toString()).to.match(TO_STRING_MATCH);
    });

    it('Should alter the curried function\'s `toString` method (recurried)', () => {
      const source = (x, y) => [x, y];
      const curried = kurrie(source);
      expect(curried.toString()).to.match(TO_STRING_MATCH);
      expect(curried('a').toString()).to.match(TO_STRING_MATCH);
      expect(curried('a')('b')).to.eql(['a', 'b']);
    });

    it('Should return the original function for nullary functions', () => {
      const source = () => 5;
      const curried = kurrie(source);
      expect(curried).to.equal(source);
    });

    it('Should return the original function for arity values <= 0 (1)', () => {
      const source = x => x;
      const curried = kurrie(source, { arity: 0 });
      expect(curried).to.equal(source);
    });

    it('Should return the original function for arity values <= 0 (2)', () => {
      const source = x => x;
      const curried = kurrie(source, { arity: -1 });
      expect(curried).to.equal(source);
    });

    it('Should return the original function for arity values <= 0 (3)', () => {
      const source = x => x;
      const curried = kurrie(source, { arity: '-5' });
      expect(curried).to.equal(source);
    });

    it('Should return the original function for arity values <= 0 (4)', () => {
      const source = x => x;
      const curried = kurrie(source, { arity: null });
      expect(curried).to.equal(source);
    });

    it('Should curry a function (unary)', () => {
      const curried = kurrie(x => x);
      expect(curried()).to.equal(curried);
      expect(curried()()).to.equal(curried);
      expect(curried()()()).to.equal(curried);
      expect(curried(1)).to.equal(1);
      expect(curried()(1)).to.equal(1);
      expect(curried()()(1)).to.equal(1);
    });

    it('Should curry a function (binary)', () => {
      const curried = kurrie((x, y) => [x, y]);
      expect(curried(1)(2)).to.eql([1, 2]);
      expect(curried(1, 2)).to.eql([1, 2]);
      expect(curried(_, 2)(1)).to.eql([1, 2]);
      expect(curried(1, _)(2)).to.eql([1, 2]);
      expect(curried(1)(_)(2)).to.eql([1, 2]);
      expect(curried(_)(1)(2)).to.eql([1, 2]);
    });

    it('Should curry a function (trinary)', () => {
      const curried = kurrie((x, y, z) => [x, y, z]);
      expect(curried(1)(2)(3)).to.eql([1, 2, 3]);
      expect(curried(1, 2, 3)).to.eql([1, 2, 3]);
      expect(curried(1)(2, 3)).to.eql([1, 2, 3]);
      expect(curried(1, 2)(3)).to.eql([1, 2, 3]);
      expect(curried(_, _, 3)(_, 2)(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(_, 3)(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(1, _)(3)).to.eql([1, 2, 3]);
      expect(curried(1)(_, 3)(2)).to.eql([1, 2, 3]);
      expect(curried(1)(2)(_, 7)(3)).to.eql([1, 2, 3]);
    });

    it('Should curry a function (unary, uncapped)', () => {
      const curried = kurrie(x => x, { capped: false });
      expect(curried()).to.equal(curried);
      expect(curried()()).to.equal(curried);
      expect(curried()()()).to.equal(curried);
      expect(curried(1)).to.equal(1);
      expect(curried()(1)).to.equal(1);
      expect(curried()()(1)).to.equal(1);
    });

    it('Should curry a function (binary, uncapped)', () => {
      const curried = kurrie((x, y) => [x, y], { capped: false });
      expect(curried(1)(2)).to.eql([1, 2]);
      expect(curried(1, 2)).to.eql([1, 2]);
      expect(curried(_, 2)(1)).to.eql([1, 2]);
      expect(curried(1, _)(2)).to.eql([1, 2]);
      expect(curried(1)(_)(2)).to.eql([1, 2]);
      expect(curried(_)(1)(2)).to.eql([1, 2]);
    });

    it('Should curry a function (trinary, uncapped)', () => {
      const curried = kurrie((x, y, z) => [x, y, z], { capped: false });
      expect(curried(1)(2)(3)).to.eql([1, 2, 3]);
      expect(curried(1, 2, 3)).to.eql([1, 2, 3]);
      expect(curried(1)(2, 3)).to.eql([1, 2, 3]);
      expect(curried(1, 2)(3)).to.eql([1, 2, 3]);
      expect(curried(_, _, 3)(_, 2)(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(_, 3)(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(1, _)(3)).to.eql([1, 2, 3]);
      expect(curried(1)(_, 3)(2)).to.eql([1, 2, 3]);
      expect(curried(1)(2)(_, 7)(3)).to.eql([1, 2, 3]);
    });

    it('Should curry a function (skipping arguments)', () => {
      const curried = kurrie((x, y, z) => [x, y, z], { capped: false });
      expect(curried(1)()(2)()(3)).to.eql([1, 2, 3]);
      expect(curried()(1, 2, 3)).to.eql([1, 2, 3]);
      expect(curried(1)()(2, 3)).to.eql([1, 2, 3]);
      expect(curried(1, 2)()(3)).to.eql([1, 2, 3]);
      expect(curried(_, _, 3)(__)(_, 2)()(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(_, 3)()(1)).to.eql([1, 2, 3]);
      expect(curried(_, 2, _)(__)(1, _)(3)).to.eql([1, 2, 3]);
      expect(curried(1)()(_, 3)(2)).to.eql([1, 2, 3]);
      expect(curried(1)(2)()(_, 7)(_)(3)).to.eql([1, 2, 3]);
    });

    it('Should curry a function (specifying arity)', () => {
      const curried = kurrie((x, y, z) => [x, y, z], { arity: 1 });
      expect(curried(1)).to.eql([1, undefined, undefined]);
    });

    it('Should curry a function (rest params, capped false)', () => {
      const curried = kurrie((x, ...rest) => [x, ...rest], { capped: false });
      expect(curried(1, 2, 3, 4)).to.eql([1, 2, 3, 4]);
    });

    it('Should curry a function (rest params, capped true)', () => {
      const curried = kurrie((x, ...rest) => [x, ...rest], { capped: true });
      expect(curried(1, 2, 3, 4)).to.eql([1]);
    });

    it('Should curry a function (default params, capped false)', () => {
      const curried = kurrie((x, y = 7) => [x, y], { capped: false });
      expect(curried(1)).to.eql([1, 7]);
      expect(curried(1, 5)).to.eql([1, 5]);
    });

    it('Should curry a function (default params, capped true)', () => {
      const curried = kurrie((x, y = 7) => [x, y], { capped: true });
      expect(curried(1)).to.eql([1, 7]);
      expect(curried(1, 5)).to.eql([1, 7]);
    });

    it('Should curry a function (default params, capped true, custom arity)', () => {
      const curried = kurrie((x, y = 7) => [x, y], { capped: true, arity: 2 });
      expect(curried(1)).to.be.a('function');
      expect(curried(1, 5)).to.eql([1, 5]);
    });

    it('Should throw if not given a function', () => {
      assert.throws(
        () => kurrie([]),
        'Expected a function for parameter `fn`',
      );
    });
  });

  describe('isCurried', () => {
    it('Should return `true` for curried functions', () => {
      const curried = kurrie(x => x);
      expect(isCurried(curried)).to.equal(true);
    });

    it('Should return `false` for non-curried functions', () => {
      expect(isCurried(x => x)).to.equal(false);
    });
  });

  describe('getSourceFunction', () => {
    it('Should return a curried function\'s source function', () => {
      const source = x => x;
      const curried = kurrie(source);

      expect(getSourceFunction(curried)).to.not.equal(curried);
      expect(getSourceFunction(curried)).to.equal(source);
    });

    it('Should return undefined for non-curried functions', () => {
      const source = x => x;
      expect(getSourceFunction(source)).to.equal(undefined);
    });

    it('Should return undefined for falsy values', () => {
      expect(getSourceFunction(null)).to.equal(undefined);
    });
  });

  describe('Placeholder: _', () => {
    it('Should be a string or symbol', () => {
      expect(typeof _).to.be.oneOf(['string', 'symbol']);
    });
  });

  describe('Placeholder: __', () => {
    it('Should be a string or symbol', () => {
      expect(typeof __).to.be.oneOf(['string', 'symbol']);
    });
  });

  describe('curryTo', () => {
    it('Should be a function', () => {
      expect(curryTo).to.be.a('function');
    });

    it('Should curry a function up to the specified arity', () => {
      expect(curryTo(1, (x, y) => [x, y])(7)).to.eql([7, undefined]);
    });
  });

  describe('curryProto', () => {
    it('Should be a function', () => {
      expect(curryProto).to.be.a('function');
    });

    it('Should curry prototype methods (1)', () => {
      const map = kurrie.proto(Array.prototype.map);
      const sum = kurrie((x, y) => x + y);
      expect(map(sum(1))([1, 2, 3])).to.eql([2, 3, 4]);
    });

    it('Should curry prototype methods (2)', () => {
      const map = kurrie.proto(Array.prototype.map);
      const slice = kurrie.proto(String.prototype.slice);
      expect(map(slice(0, 3))(['foobar', 'bazbar'])).to.eql(['foo', 'baz']);
    });

    it('Should curry prototype methods (custom arity)', () => {
      const slice = kurrie.proto(String.prototype.slice, { arity: 2 });
      expect(slice(3)('foobar')).to.equal('bar');
    });

    it('Should curry prototype methods (custom arity, testing capped)', () => {
      const map = kurrie.proto(Array.prototype.map);
      const slice = kurrie.proto(String.prototype.slice, { arity: 2 });
      expect(map(slice(3))(['foobar', 'bazbar'])).to.eql(['bar', 'bar']);
    });

    it('Should curry prototype methods (custom arity, testing uncapped)', () => {
      const map = kurrie.proto(Array.prototype.map);
      const slice = kurrie.proto(String.prototype.slice, { arity: 2, capped: false });

      // Too many arguments passed to slice (got the map iteratee index argument).
      expect(map(slice(3))(['foobar', 'bazbar'])).to.eql(['', '']);
    });

    describe('JSDOC Examples', () => {
      it('Should work like in the docs (1)', () => {
        const curried = kurrie((x, y, z) => x + y + z);
        expect(curried()).to.be.a('function');
        expect(curried(1)).to.be.a('function');
        expect(curried(1)(2)).to.be.a('function');
        expect(curried(1)(2)(3)).to.equal(6);
        expect(curried(1, 2)(3)).to.equal(6);
        expect(curried(1)(2, 3)).to.equal(6);
        expect(curried(1, 2, 3)).to.equal(6);

        const triples = kurrie((a, b, c) => [a, b, c]);
        expect(triples(_, 2, 3)(1)).to.eql([1, 2, 3]);
        expect(triples(_, _, 3)(1)(2)).to.eql([1, 2, 3]);
        expect(triples(1)(_)(2)(_)(3)).to.eql([1, 2, 3]);
        expect(triples(1)(_, 3)(2)).to.eql([1, 2, 3]);
        expect(triples(_, 2)(1)(3)).to.eql([1, 2, 3]);
      });

      it('Should work like in the docs (2)', () => {
        const map = kurrie.proto(Array.prototype.map);
        expect(map(x => x * 2)([1, 2, 3])).to.eql([2, 4, 6]);

        const filter = kurrie.proto(Array.prototype.filter);
        const isOdd = filter(x => x % 2);
        expect(isOdd([1, 2, 3])).to.eql([1, 3]);

        const toUpperCase = kurrie.proto(String.prototype.toUpperCase);
        expect(toUpperCase('foobar')).to.equal('FOOBAR');

        const slice = kurrie.proto(String.prototype.slice);
        expect(slice(0)(3)('foobar')).to.equal('foo');

        const sliceS = kurrie.proto(String.prototype.slice, { arity: 2 });
        expect(sliceS(3)('foobar')).to.equal('bar');
      });
    });
  });

  describe('uncurry', () => {
    it('Should be an alias for `getSourceFunction`', () => {
      expect(getSourceFunction).to.equal(uncurry);
    });
  });
});
