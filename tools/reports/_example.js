// Name of the module.
module.exports.name = 'example module'

// Description of the module
module.exports.description = 'An example module to show how it works'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=10.0'

// Reporting function
module.exports.func = function (program, backup) {
  // This function will be called with the `commander` program, and the iPhoneBackup instance as arguments
}

// --- OR ---

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {
    '>=10.0': function(program,backup) {
        // This function would be called for iOS 10+
    }, 
    '>=9.0,<10.0': function(program,backup) {
        // This function would be called for all iOS 9.
    }
}