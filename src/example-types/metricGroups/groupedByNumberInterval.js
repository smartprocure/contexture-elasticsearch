let { statsAggs, simplifyBuckets } = require('./utils')
let { calcSmartInterval } = require('../../utils/smartInterval')
let statistical = require('../statistical')
let getStats = search => field => statistical.result({ field }, search)

let buildQuery = async (
  { statsField, stats, groupField: field, interval = 'smart' },
  getStats
) => {
  if (interval === 'smart') {
    let { min, max } = await getStats(field)
    interval = calcSmartInterval(min, max)
  }

  return {
    aggs: {
      groups: {
        histogram: { field, interval, min_doc_count: 0 },
        ...statsAggs(statsField, stats),
      },
    },
  }
}

module.exports = {
  buildQuery,
  validContext: node => node.groupField && node.statsField,
  async result(node, search) {
    let response = await search(buildQuery(node, getStats(search)))
    return { results: simplifyBuckets(response.aggregations.groups.buckets) }
  },
}