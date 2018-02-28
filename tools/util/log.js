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
  var indent = ''

  for (var i = 0; i < lvl; i++) {
    indent += '  '
  }

  return indent
}

/**
 * Print an error to the screen.
 * These will only be output if log level >= 0
 * Args is a description of the error.
 * @param {*} args - string description
 */
module.exports.error = function (...args) {
  if (!isVerbose(0)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent() + chalk.red('ERROR!'), ...args)
}

/**
 * Print to the screen that an action was taken
 * These will only be output if log level >= 1
 * @param {string} action - Action that was taken
 * @param {*} args - string description
 */
module.exports.action = function (action, ...args) {
  if (!isVerbose(1)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent() + chalk.green(action), ...args)
}

/**
 * Print to screen that a group of actions happened
 * These will only be output if log level >= 1
 * @param {string} action - action
 * @param {*} args - string description
 */
module.exports.begin = function (action, ...args) {
  if (!isVerbose(1)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent() + chalk.green(action), ...args)
  lvl += 1
}

/**
 * Exit indent group
 * These will only be output if log level >= 1
 */
module.exports.end = function () {
  if (!isVerbose(1)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  lvl -= 1
}

/**
 * Print a warning
 * * These will only be output if log level >= 0
 * @param {*} args - String description of the warning
 */
module.exports.warning = function (...args) {
  if (!isVerbose(0)) { return }

  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent() + chalk.yellow('WARNING!'), ...args)
}

/**
 * Verbose logging drop-in for console.log
 * These will only be output if log level >= 2
 * @param {*} args - print output
 */
module.exports.verbose = function (...args) {
  if (!isVerbose(2)) { return }
  if (wasRaw) {
    console.log('')
    wasRaw = false
  }

  console.log(indent() + chalk.blue('verbose'), ...args)
}

/**
 * Raw logging drop-in for console.log
 * These lines will NOT be formatted.
 * These will only be output if log level >= 0
 * @param {*} args - print output
 */
module.exports.raw = function (...args) {
  if (!isVerbose(0)) { return }

  if (!wasRaw) {
    console.log('')
    wasRaw = true
  }

  console.log(...args)
}
