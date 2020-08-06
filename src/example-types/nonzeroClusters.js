let _ = require('lodash/fp')
let histogramResult = require('./smartIntervalHistogram').result

function calcClusters(entries, interval, isSignificant) {
  let clusters = []
  let prev = { count: 0 }
  if (!isSignificant) {
    isSignificant = x => x !== 0
  }

  _.each(entry => {
    if (isSignificant(entry.count)) {
      if (!isSignificant(prev.count)) {
        clusters.push([entry.key, entry.key + interval, entry.count])
      } else {
        clusters[clusters.length - 1][1] = entry.key + interval
        clusters[clusters.length - 1][2] += entry.count
      }
    }

    prev = entry
  }, entries)

  return clusters
}

module.exports = {
  validContext: node => node.field,
  result: (node, search) =>
    histogramResult(node, search).then(histResult => ({
      clusters: _.map(
        cluster => ({
          min: cluster[0],
          max: cluster[1],
          count: cluster[2],
        }),
        calcClusters(histResult.entries, histResult.interval)
      ),
    })),
}
