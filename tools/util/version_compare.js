// Add zeros to an array until it reaches a specific length.
function zeroPad (array, length) {
  for (var i = array.length; i < length; i++) {
    array[i] = 0
  }

  return array
}

function aLessB (a, b) {
  var maxLength = a.length > b.length ? a.length : b.length

  a = zeroPad(a.map(el => el === undefined ? 0 : parseInt(el)), maxLength)
  b = zeroPad(b.map(el => el === undefined ? 0 : parseInt(el)), maxLength)

  // Check if any of the declared items in a are less than their component in B.
  for (let i = 0; i < a.length; i++) {
    // If this component is less, the entire thing must be less
    if (a[i] < b[i]) {
      return true
    }

    // If this item is greater, the entire thing is greater.
    if (a[i] > b[i]) {
      return false
    }
  }

  return true
}

// Check if two arrays are equal.
function aEqualB (a, b) {
  if (a.length !== b.length) return false

  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

// Comparison types
const comparisonFuncs = {
  '>=': (a, b) => { return !aLessB(a, b) || aEqualB(a, b) },
  '>': (a, b) => { return !aLessB(a, b) },
  '<=': (a, b) => { return aLessB(a, b) || aEqualB(a, b) },
  '<': (a, b) => { return aLessB(a, b) },
  '=': (a, b) => { return aEqualB(a, b) }
}

function comparison (backup, declared) {
  var backupComponents = /(>=|>|<|<=|=|~)?(?: +)?(\d+)(?:\.(\d+))?(?:\.(\d+))?/g.exec(backup)
  var declaredComponents = /(>=|>|<|<=|=|~)?(?: +)?(\d+)(?:\.(\d+))?(?:\.(\d+))?/g.exec(declared)

  const comparison = declaredComponents[1]

  return comparisonFuncs[comparison](backupComponents.slice(2, 5), declaredComponents.slice(2, 5))
}

// Check if a version satisfies a declared version constraint
module.exports.versionCheck = function (backup, declared) {
  var declaredItems = declared.split(',').map(el => el.trim())

  for (var i = 0; i < declaredItems.length; i++) {
    if (!comparison(backup, declaredItems[i])) {
      return false
    }
  }

  return true
}
