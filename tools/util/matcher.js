const log = require('./log')

// Match an object with a query.
// Ex: Querying a.* on { a: { b: 1, c: 2 }}} -> [1, 2]
// We stop recusively attempting if isLeaf(node) returns true.
module.exports = function match (object, query, isLeaf) {
  isLeaf = isLeaf || function () { return true }

  query = query || '*'
  query = query.split('.')

  return doMatch(object, query, isLeaf)
}

function nameMatches (query, name) {
  /// __group is a reserved name.
  if (name === '__group') {
    return false
  }

  if (query === '*') {
    return true
  } else if (query === name) {
    return true
  }

  return false
}

function doMatch (object, query, isLeaf) {
  query = query || []

  let result = []
  let level = query.shift() || '*'

  for (let [ key, value ] of Object.entries(object)) {
    // If the name doesn't match, continue.
    if (!nameMatches(level, key)) {
      continue
    }

    
    if (isLeaf(value)) {
      // If it's a leaf, add a result.
      result.push(value)
    } else {
      // Otherwise, add child results.
      // We must slice(0) the query, so that it is duplicated.
      result = [...result, ...doMatch(value, query.slice(0), isLeaf)]
    }

  }

  return result
}
