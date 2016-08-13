var Event, Promise, Random, Type, assertType, fromArgs, immediate, sync, type;

assertType = require("assertType");

immediate = require("immediate");

fromArgs = require("fromArgs");

Promise = require("Promise");

Random = require("random");

Event = require("Event");

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
    didFinish: Event(),
    _queue: [],
    _promises: [],
    _onError: options.onError
  };
});

type.defineGetters({
  length: function() {
    return this._queue.length;
  },
  numActive: function() {
    return this._promises.length;
  }
});

type.defineMethods({
  push: function(func) {
    assertType(func, Function);
    this._queue.push(func);
    this._tryNext();
  },
  unshift: function(func) {
    assertType(func, Function);
    this._queue.unshift(func);
    this._tryNext();
  },
  concat: function(iterable, iterator) {
    assertType(iterator, Function.Maybe);
    if (iterator) {
      sync.each(iterable, (function(_this) {
        return function(value, key) {
          return _this.push(function() {
            return iterator(value, key);
          });
        };
      })(this));
    } else {
      sync.each(iterable, (function(_this) {
        return function(value) {
          return _this.push(value);
        };
      })(this));
    }
  },
  done: function(func) {
    var deferred, listener;
    assertType(func, Function.Maybe);
    deferred = Promise.defer();
    listener = this.didFinish(1, function() {
      if (!func) {
        deferred.resolve();
        return;
      }
      return Promise["try"](func).then(deferred.resolve).fail(deferred.reject);
    });
    listener.start();
    return deferred.promise;
  },
  _next: function() {
    var onFulfilled, promise, promises, tryNext;
    promises = this._promises;
    tryNext = this._tryNext;
    onFulfilled = function() {
      var index;
      index = promises.indexOf(promise);
      promises.splice(index, 1);
      tryNext();
    };
    promise = Promise["try"](this._queue.shift()).then(onFulfilled, this._onError);
    promises.push(promise);
  }
});

type.defineBoundMethods({
  _tryNext: function() {
    if (this._promises.length < this.maxConcurrent) {
      if (this._queue.length > 0) {
        return this._next();
      }
      if (this._promises.length > 0) {
        return;
      }
      this.didFinish.emit();
    }
  }
});

module.exports = type.build();

//# sourceMappingURL=map/PromiseQueue.map
