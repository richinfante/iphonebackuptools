const log = require('./log')

// Use case:
// GET safari.*
// GET options.*

module.exports = function match (object, query, isLeaf) {
  isLeaf = isLeaf || function () { return true }

  query = query || '*'
  query = query.split('.')

  return doMatch(object, query, isLeaf)
}

function nameMatches (query, name) {
  if (query === '*') {
    return true
  } else if (query === name) {
    return true
  }

  return false
}

function doMatch (object, query, isLeaf) {
  query = query || []
  log.verbose('NEW LEVEL', query, 'ON', object)
  let result = []
  let level = query.shift() || '*'

  for (let [ key, value ] of Object.entries(object)) {
    log.verbose('CHECK PAIR', key, '=', value)
    if (!nameMatches(level, key)) {
      log.verbose('MATCH FAILED', level, 'against', key)
      continue
    } else {
      log.verbose('MATCH OK')
    }

    if (isLeaf(value)) {
      result.push(value)
    } else {
      result = [...result, ...doMatch(value, query.slice(0), isLeaf)]
    }

    log.verbose('INT. RESULT', result)
  }

  log.verbose('FIN. RESULT', result)

  return result
}
