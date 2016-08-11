
immediate = require "immediate"
fromArgs = require "fromArgs"
Promise = require "Promise"
Random = require "random"
Event = require "Event"
Type = require "Type"

type = Type "PromiseQueue"

type.defineOptions
  maxConcurrent: Number.isRequired
  onError: Function.withDefault (error) -> immediate -> throw error

type.defineValues

  maxConcurrent: fromArgs "maxConcurrent"

  didFinish: -> Event()

  _queue: -> []

  _promises: -> []

  _onError: fromArgs "onError"

type.defineGetters

  length: -> @_queue.length

  numActive: -> @_promises.length

type.defineMethods

  push: (func) ->
    @_queue.push func
    @_tryNext()
    return

  unshift: (func) ->
    @_queue.unshift func
    @_tryNext()
    return

  onceFinished: (func) ->
    listener = @didFinish 1, func
    return listener.start()

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
