let sequentialResultTest = require('./testUtils').sequentialResultTest

describe('term_stats', () => {
  let test = (...x) =>
    sequentialResultTest(
      [
        {
          aggregations: {
            twoLevelFilter: {
              twoLevelAgg: {
                buckets: [
                  {
                    key: 'City of Deerfield',
                    doc_count: 50,
                    twoLevelAgg: {
                      count: 6,
                      min: 60,
                      max: 98,
                      avg: 78.5,
                      sum: 471
                    }
                  },
                  {
                    key: 'City of Boca',
                    doc_count: 50,
                    twoLevelAgg: {
                      count: 6,
                      min: 60,
                      max: 98,
                      avg: 78.5,
                      sum: 471
                    }
                  }
                ]
              }
            }
          }
        }
      ],
      ...x
    )
  it('should work', () =>
    test(
      {
        key: 'test',
        type: 'terms_stats',
        config: {
          key_field: 'Organization.Name.untouched',
          value_field: 'LineItem.TotalPrice'
        }
      },
      {
        terms: [
          {
            key: 'City of Deerfield',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          },
          {
            key: 'City of Boca',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          }
        ]
      },
      [
        {
          aggs: {
            twoLevelAgg: {
              terms: {
                field: 'Organization.Name.untouched',
                size: 10,
                order: {
                  'twoLevelAgg.sum': 'desc'
                }
              },
              aggs: {
                twoLevelAgg: {
                  stats: {
                    field: 'LineItem.TotalPrice'
                  }
                }
              }
            }
          }
        }
      ]
    ))
  it('should support a filter', () =>
    test(
      {
        key: 'test',
        type: 'terms_stats',
        config: {
          key_field: 'Organization.Name.untouched',
          value_field: 'LineItem.TotalPrice',
          filter: 'city'
        }
      },
      {
        terms: [
          {
            key: 'City of Deerfield',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          },
          {
            key: 'City of Boca',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          }
        ]
      },
      [
        {
          aggs: {
            twoLevelFilter: {
              filter: {
                bool: {
                  must: [
                    {
                      wildcard: {
                        'Organization.Name.lowercased': '*city*'
                      }
                    }
                  ]
                }
              },
              aggs: {
                twoLevelAgg: {
                  terms: {
                    field: 'Organization.Name.untouched',
                    size: 10,
                    order: {
                      'twoLevelAgg.sum': 'desc'
                    }
                  },
                  aggs: {
                    twoLevelAgg: {
                      stats: {
                        field: 'LineItem.TotalPrice'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    ))
  it('should support a filter with ridiculous spaces', () =>
    test(
      {
        key: 'test',
        type: 'terms_stats',
        config: {
          key_field: 'Organization.Name.untouched',
          value_field: 'LineItem.TotalPrice',
          filter: 'city   of    '
        }
      },
      {
        terms: [
          {
            key: 'City of Deerfield',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          },
          {
            key: 'City of Boca',
            doc_count: 50,
            count: 6,
            min: 60,
            max: 98,
            avg: 78.5,
            sum: 471
          }
        ]
      },
      [
        {
          aggs: {
            twoLevelFilter: {
              filter: {
                bool: {
                  must: [
                    {
                      wildcard: {
                        'Organization.Name.lowercased': '*city*'
                      }
                    },
                    {
                      wildcard: {
                        'Organization.Name.lowercased': '*of*'
                      }
                    }
                  ]
                }
              },
              aggs: {
                twoLevelAgg: {
                  terms: {
                    field: 'Organization.Name.untouched',
                    size: 10,
                    order: {
                      'twoLevelAgg.sum': 'desc'
                    }
                  },
                  aggs: {
                    twoLevelAgg: {
                      stats: {
                        field: 'LineItem.TotalPrice'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    ))
})