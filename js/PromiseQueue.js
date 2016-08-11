var Event, Promise, Random, Type, fromArgs, immediate, type;

immediate = require("immediate");

fromArgs = require("fromArgs");

Promise = require("Promise");

Random = require("random");

Event = require("Event");

Type = require("Type");

type = Type("PromiseQueue");

type.defineOptions({
  maxConcurrent: Number.isRequired,
  onError: Function.withDefault(function(error) {
    return immediate(function() {
      throw error;
    });
  })
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
  },
  _onError: fromArgs("onError")
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
  onceFinished: function(func) {
    var listener;
    listener = this.didFinish(1, func);
    return listener.start();
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
