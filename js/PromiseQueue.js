var Event, Promise, Random, Type, fromArgs, immediate, type;

immediate = require("immediate");

fromArgs = require("fromArgs");

Promise = require("Promise");

Random = require("random");

Event = require("Event");

Type = require("Type");

type = Type("PromiseQueue");

type.defineOptions({
  maxConcurrent: Number.isRequired
});

type.defineValues({
  maxConcurrent: fromArgs("maxConcurrent"),
  didFinish: function() {
    return Event();
  },
  _queue: function() {
    return [];
  },
  _promises: function() {
    return [];
  }
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
    this._queue.push(func);
    this._tryNext();
  },
  unshift: function(func) {
    this._queue.unshift(func);
    this._tryNext();
  },
  _next: function() {
    var onFulfilled, onRejected, promise, promises, tryNext;
    promises = this._promises;
    tryNext = this._tryNext;
    onFulfilled = function() {
      var index;
      index = promises.indexOf(promise);
      promises.splice(index, 1);
      tryNext();
    };
    onRejected = function(error) {
      immediate(function() {
        throw error;
      });
    };
    promise = Promise["try"](this._queue.shift()).then(onFulfilled, onRejected);
    promises.push(promise);
  }
});

type.defineBoundMethods({
  _tryNext: function() {
    if (this._queue.length === 0) {
      this.didFinish.emit();
    } else if (this._promises.length < this.maxConcurrent) {
      this._next();
    }
  }
});

module.exports = type.build();

//# sourceMappingURL=map/PromiseQueue.map
