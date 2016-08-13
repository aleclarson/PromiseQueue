
assertType = require "assertType"
immediate = require "immediate"
fromArgs = require "fromArgs"
Promise = require "Promise"
Random = require "random"
Event = require "Event"
Type = require "Type"
sync = require "sync"

type = Type "PromiseQueue"

type.defineOptions
  maxConcurrent: Number.isRequired
  onError: Function.withDefault (error) -> immediate -> throw error

type.defineValues (options) ->

  maxConcurrent: options.maxConcurrent

  didFinish: Event()

  _queue: []

  _promises: []

  _onError: options.onError

type.defineGetters

  length: -> @_queue.length

  numActive: -> @_promises.length

type.defineMethods

  push: (func) ->
    assertType func, Function
    @_queue.push func
    @_tryNext()
    return

  unshift: (func) ->
    assertType func, Function
    @_queue.unshift func
    @_tryNext()
    return

  concat: (iterable, iterator) ->
    assertType iterator, Function.Maybe
    if iterator
      sync.each iterable, (value, key) =>
        @push -> iterator value, key
    else
      sync.each iterable, (value) =>
        @push value
    return

  done: (func) ->
    assertType func, Function.Maybe
    deferred = Promise.defer()
    listener = @didFinish 1, ->
      if not func
        deferred.resolve()
        return
      Promise.try func
        .then deferred.resolve
        .fail deferred.reject
    listener.start()
    return deferred.promise

  _next: ->
    promises = @_promises
    tryNext = @_tryNext

    onFulfilled = ->
      index = promises.indexOf promise
      promises.splice index, 1
      tryNext()
      return

    promise = Promise.try @_queue.shift()
      .then onFulfilled, @_onError

    promises.push promise
    return

type.defineBoundMethods

  _tryNext: ->
    if @_promises.length < @maxConcurrent
      return @_next() if @_queue.length > 0
      return if @_promises.length > 0
      @didFinish.emit()
    return

module.exports = type.build()
