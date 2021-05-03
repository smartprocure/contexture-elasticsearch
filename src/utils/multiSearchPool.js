let _ = require('lodash/fp')
let F = require('futil')

let scheduled = []
let clearScheduled = () => {
  scheduled = []
}
let schedule = cb => {
  if (scheduled.length === 0) {
    // setImmediate to schedule behind current I/O event callbacks
    // so we can batch all available requests in one multi-search
    setImmediate(() => _.over([clearScheduled, ...scheduled])())
  }

  scheduled.push(cb)
}

let multiSearchPool = config => {
  let {
    searchConcurrency: maxConcurrency = 1000,
    searchBatchSize: maxBatchSize = 100,
  } = config
  let client = config.getClient()
  let concurrency = 0
  let pendingRequests = []

  let search = request => {
    // first request
    if (pendingRequests.length === 0 && concurrency < maxConcurrency)
      schedule(runMultiSearch)

    let defer = F.defer()

    pendingRequests.push({ request, defer })

    return defer.promise
  }

  let maybeSchedule = () => {
    // if there are pending requests and free concurrency slots
    if (pendingRequests.length > 0 && concurrency < maxConcurrency)
      schedule(runMultiSearch)
  }

  let runMultiSearch = () => {
    let batchSize = Math.min(maxBatchSize, maxConcurrency - concurrency)
    let requests = pendingRequests.splice(0, batchSize)
    let { length } = requests

    if (length === 0) return

    // lock concurrency slots
    concurrency += length

    maybeSchedule() // if this batch doesn't include all the requests

    client
      .msearch({
        body: _.flatMap(({ request: { index, body } }) => [{ index }, body])(
          requests
        ),
      })
      .then(({ body }) => {
        // release some concurrency slots
        concurrency -= length
        maybeSchedule()

        F.eachIndexed((result, i) => {
          let defer = requests[i].defer
          if (result.error) defer.reject({ meta: { body: result } })
          else defer.resolve({ body: result })
        })(body.responses)
      })
  }

  return search
}

module.exports = multiSearchPool
