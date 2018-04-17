
module.exports = {
  /**
   * The reporting API version. This should be set to 3.
   */
  version: 4,

  /**
   * Report name. This should match the nesting found in the reports.js file.
   */
  name: 'ibackuptool.example',

  /**
   * Human readable description of the file
   */
  description: `Example Report module.`,

  /**
   * Optional flag requiring a backup parameter to be present in order to run this report.
   */
  requiresBackup: true,

  /**
   * Run on a v3 lib / backup object.
   * The run() function must return a promise, which always resolves to valid data.
   * If the files aren't in the backup or aren't formatted in a known way, we reject
   * and print the error message for the user.
   * @param {object} lib standard lib, contains lib.run() function.
   * @param {object} options options object.
   */
  run (lib, { backup }) {
    return new Promise((resolve, reject) => {
      // resolve to valid data.
      // Typically, this would be "raw" data containing as much info as possible.
      // Se below for data formatting.
      resolve([{
        name: 'example1',
        data: {
          code: 33,
          values: [1, 2, 3, 4, 5]
        }
      }])
    })
  },

  /**
   * The "output" property declares the public interface for most operations.
   * This provides a level of abstraction from the datatypes that are stored in the
   * backups since they may vary between versions, or need normalization.
   *
   * This collection of functions allows that to occur.
   */
  output: {
    name: el => el.name,
    code: el => el.data.code
  }

  /*
    For the above example, if run() resolved to:
    [{
      name: 'example1',
      data: {
        code: 33,
        values: [1, 2, 3, 4, 5]
      }
    }]

    The actual module output when using a normal json, csv, table formatter would be the following,
    due to the output declaration:

    [{
      name: 'example1',
      code: 33
    }]

    // We can also output a single raw object:
    {
      Name: 'test',
      Version: '1.0',
      BackupData: [104, 101, 108, 108, 111, 044, 119, 111, 114, 108, 100]
    }

    // And map it using the following output declaration:
    output: {
      name: el => el.Name,
      version: el => el.Version
    }

    To the following:
    {
      name: 'test',
      version: '1.0'
    }

    IF we specify a "raw" formatter, or run using the { raw: true } parameter to lib.run(),
    We'd get back the original raw object.

    {
      Name: 'test',
      Version: '1.0',
      BackupData: [104, 101, 108, 108, 111, 044, 119, 111, 114, 108, 100]
    }
  */
}
