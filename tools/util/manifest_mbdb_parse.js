const crypto = require('crypto')
const fs = require('fs')
const BufferReader = require('buffer-reader');

const getInt = (reader, intSize, debug) => {
  //Retrieve an integer (big-endian)
  let value = 0
  while (intSize > 0) {
    let int8 = reader.nextUInt8()
    value = (value << 8) + int8
    intSize = intSize - 1
  }
  return value
}

const getString = (reader) => {
  if (reader.nextBuffer(1).toString('hex') === 'ff') {
    if (reader.nextBuffer(1).toString('hex') === 'ff')
      return '' // Blank string
    else reader.move(-2) //Move reader back if is a valid string length
  } else reader.move(-1) //Move reader back accordingly

  const length = getInt(reader, 2) // 2-byte length
  value = reader.nextString(length)
  return value
}

module.exports.process = (filename, resolve, reject) => {
  let mbdb = []
  let contents = null
  try {
    contents = fs.readFileSync(filename)
    
    const reader = new BufferReader(contents);
    if (reader.nextString(4) === 'mbdb' && reader.nextBuffer(2).toString('hex') === '0500'){
      while (reader.tell() < contents.byteLength) {
        let fileInfo = {}
        fileInfo['domain'] = getString(reader)
        fileInfo['filename'] = getString(reader)
        fileInfo['linktarget'] = getString(reader)
        fileInfo['datahash'] = getString(reader)
        fileInfo['enckey'] = getString(reader)
        fileInfo['mode'] = getInt(reader, 2)
        fileInfo['inode'] = getInt(reader, 8)
        fileInfo['userid'] = getInt(reader, 4)
        fileInfo['groupid'] = getInt(reader, 4)
        fileInfo['mtime'] = getInt(reader, 4)
        fileInfo['atime'] = getInt(reader, 4)
        fileInfo['ctime'] = getInt(reader, 4)
        fileInfo['filelen'] = getInt(reader, 8)
        fileInfo['flag'] = getInt(reader, 1)
        fileInfo['numprops'] = getInt(reader, 1)
        fileInfo['properties'] = {}
        for (let i = 0; i < fileInfo['numprops']; i++) {
          fileInfo['properties'][getString(reader)] = getString(reader)
        }
        const fullpath = fileInfo['domain'] + '-' + fileInfo['filename']
        fileInfo['fileID'] = crypto.createHash('sha1').update(fullpath).digest('hex')
        mbdb.push(fileInfo)
      }
    } else {
      const err = 'This does not look like an MBDB file'
      reject(err)
    }
  } catch (e) {
    console.log('Cannot open Manifest.mbdb')
    reject(e)
  }
  resolve(mbdb)
}