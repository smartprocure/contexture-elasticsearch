import _ from 'lodash/fp.js'
import esTwoLevel from './esTwoLevelAggregation.js'
import { not } from '../../utils/elasticDSL.js'

export default {
  validContext: node => node.key_field && node.value_field && node.key_value,
  result(node, search) {
    let filter = {
      [node.key_type || 'term']: {
        [node.key_field]: node.key_value,
      },
    }
    return esTwoLevel.result(
      _.merge(
        {
          key_type: 'filters',
          key_data: {
            filters: {
              pass: filter,
              fail: not(filter),
            },
            field: null,
          },
          value_type: 'stats',
        },
        node
      ),
      search
    )
  },
}
