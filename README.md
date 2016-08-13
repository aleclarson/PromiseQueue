
# PromiseQueue v1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

```coffee
queue = PromiseQueue
  maxConcurrent: 2

# Add operation to the start of the queue.
queue.unshift -> makePromise()

# Add operation to the end of the queue.
queue.push -> makePromise()

# Listen for the next 'finish' event.
promise = queue.done callback

# Listen to 'finish' events forever.
listener = queue.didFinish callback

# Start the listener lifecycle.
listener.start()
```
