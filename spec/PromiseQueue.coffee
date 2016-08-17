
Promise = require "Promise"

PromiseQueue = require ".."

describe "PromiseQueue", ->

  it "enforces a maximum number of concurrent operations", ->

    queue = PromiseQueue
      maxConcurrent: 1

    d1 = Promise.defer()
    queue.push -> d1.promise

    spy = jasmine.createSpy()
    queue.push -> spy()

    queue.start()

    expect queue.numActive
      .toBe 1

    expect queue.numQueued
      .toBe 1

  it "emits a 'didFinish' event once empty", (done) ->

    queue = PromiseQueue
      maxConcurrent: 1

    d1 = Promise.defer()
    queue.push -> d1.promise

    d2 = Promise.defer()
    queue.push -> d2.promise

    listener = queue.didFinish 1, ->
      expect queue.numActive
        .toBe 0

    listener.start()

    Promise.all queue._promises
      .then ->
        expect listener.calls
          .toBe 1
        done()

    d1.resolve()
    d2.resolve()

  it "calls 'options.onError' when a promise is rejected", (done) ->

    error = FakeError()


    Promise.all queue._promises
      .always ->
        expect spy.calls.count()
          .toBe 1
        done()
