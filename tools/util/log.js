const chalk = require('chalk')

const VERBOSE_KEY = Symbol('verbose_key')

var lvl = 0
var wasRaw = false

module.exports.setVerbose = function (value) {
  global[VERBOSE_KEY] = value
}

function isVerbose (i) {
  return global[VERBOSE_KEY] >= i
}

function indent () {
  var indent = ' '

  for (var i = 0; i < lvl; i++) {
    indent += '  '
  }

  return indent
}

module.exports.error = function (...args) {
  if (!isVerbose(0)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent(), chalk.red('error'), ...args)
}

module.exports.action = function (action, ...args) {
  if (!isVerbose(1)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent(), chalk.green(action), ...args)
}

module.exports.begin = function (action, ...args) {
  if (!isVerbose(1)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent(), chalk.green(action), ...args)
  lvl += 1
}

module.exports.end = function () {
  if (!isVerbose(1)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  lvl -= 1
}

module.exports.warning = function (action, ...args) {
  if (!isVerbose(0)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent(), chalk.green('warning'), ...args)
}

module.exports.verbose = function (...args) {
  if (!isVerbose(2)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent(), chalk.blue('verbose'), ...args)
}

module.exports.raw = function (...args) {
  if (!isVerbose(0)) { return }

  if (!wasRaw) {
    console.log('')
    wasRaw = true
  }

  console.log(...args)
}
