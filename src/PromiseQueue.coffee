
assertType = require "assertType"
immediate = require "immediate"
Promise = require "Promise"
Random = require "random"
Type = require "Type"
sync = require "sync"

type = Type "PromiseQueue"

type.defineOptions
  maxConcurrent: Number.isRequired
  onError: Function.withDefault (error) ->
    immediate -> throw error

type.defineValues (options) ->

  maxConcurrent: options.maxConcurrent

  _onError: options.onError

  _resolving: null

  _promises: []

  _queue: []

type.defineGetters

  numActive: -> @_promises.length

  numQueued: -> @_queue.length

type.defineMethods

  push: (func) ->
    assertType func, Function
    @_queue.push func
    return

  unshift: (func) ->
    assertType func, Function
    @_queue.unshift func
    return

  concat: (iterable, iterator) ->
    assertType iterator, Function.Maybe
    sync.each iterable, @_resolveIterator iterator
    return

  start: ->
    return if @_resolving

    {length} = @_queue
    if length is 0
      throw Error "The queue cannot be empty!"

    @_resolving = Promise.defer()
    length = Math.min length, @maxConcurrent
    @_next() while 0 < length--
    return @_resolving.promise

  _next: ->
    promises = @_promises
    tryNext = @_tryNext

    onFulfilled = ->
      index = promises.indexOf promise
      promises.splice index, 1
      tryNext()

    promise = Promise.try @_queue.shift()
      .then onFulfilled, @_onError

    promises.push promise
    return

  _resolveIterator: (iterator) ->
    queue = @_queue

    if iterator
      return (value, key) ->
        queue.push -> iterator value, key

    return (value) ->
      assertType value, Function
      queue.push value

type.defineBoundMethods

  _tryNext: ->
    numActive = @_promises.length
    return if numActive >= @maxConcurrent
    return @_next() if @_queue.length > 0
    @_resolving.resolve() if numActive is 0
    return

module.exports = type.build()
