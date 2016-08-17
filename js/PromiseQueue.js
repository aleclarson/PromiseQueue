var Promise, Random, Type, assertType, immediate, sync, type;

assertType = require("assertType");

immediate = require("immediate");

Promise = require("Promise");

Random = require("random");

Type = require("Type");

sync = require("sync");

type = Type("PromiseQueue");

type.defineOptions({
  maxConcurrent: Number.isRequired,
  onError: Function.withDefault(function(error) {
    return immediate(function() {
      throw error;
    });
  })
});

type.defineValues(function(options) {
  return {
    maxConcurrent: options.maxConcurrent,
    _onError: options.onError,
    _resolving: null,
    _promises: [],
    _queue: []
  };
});

type.defineGetters({
  numActive: function() {
    return this._promises.length;
  },
  numQueued: function() {
    return this._queue.length;
  }
});

type.defineMethods({
  push: function(func) {
    assertType(func, Function);
    this._queue.push(func);
  },
  unshift: function(func) {
    assertType(func, Function);
    this._queue.unshift(func);
  },
  concat: function(iterable, iterator) {
    assertType(iterator, Function.Maybe);
    sync.each(iterable, this._resolveIterator(iterator));
  },
  start: function() {
    var length;
    if (this._resolving) {
      return;
    }
    length = this._queue.length;
    if (length === 0) {
      throw Error("The queue cannot be empty!");
    }
    this._resolving = Promise.defer();
    length = Math.min(length, this.maxConcurrent);
    while (0 < length--) {
      this._next();
    }
    return this._resolving.promise;
  },
  _next: function() {
    var onFulfilled, promise, promises, tryNext;
    promises = this._promises;
    tryNext = this._tryNext;
    onFulfilled = function() {
      var index;
      index = promises.indexOf(promise);
      promises.splice(index, 1);
      return tryNext();
    };
    promise = Promise["try"](this._queue.shift()).then(onFulfilled, this._onError);
    promises.push(promise);
  },
  _resolveIterator: function(iterator) {
    var queue;
    queue = this._queue;
    if (iterator) {
      return function(value, key) {
        return queue.push(function() {
          return iterator(value, key);
        });
      };
    }
    return function(value) {
      assertType(value, Function);
      return queue.push(value);
    };
  }
});

type.defineBoundMethods({
  _tryNext: function() {
    var numActive;
    numActive = this._promises.length;
    if (numActive >= this.maxConcurrent) {
      return;
    }
    if (this._queue.length > 0) {
      return this._next();
    }
    if (numActive === 0) {
      this._resolving.resolve();
    }
  }
});

module.exports = type.build();

//# sourceMappingURL=map/PromiseQueue.map
