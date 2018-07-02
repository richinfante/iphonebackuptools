const fs = require('fs-extra')
const path = require('path')
const log = require('../../util/log')
const apple_timestamp = require('../../util/apple_timestamp')

module.exports = {
  version: 4,
  name: 'phone.address_book',
  description: `List all address book records contained in the backup.`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup, extract }) {
    return new Promise(async (resolve, reject) => {
      try {
          let items = await getAddressBook(backup, extract)

        resolve(items)
      } catch (e) {
        reject(e)
      }
    })
  },

  // Manifest fields.
  output: {
    id: el => el.ROWID,
    first: el => el.First || null,
    last: el => el.Last || null,
    organization: el => el.organization || null,
    phoneWork: el => el.phone_work || null,
    phoneMobile: el => el.phone_mobile || null,
    phoneHome: el => el.phone_home || null,
    email: el => el.email || null,
    createdDate: el => el.created_date || null,
    note: el => el.note || null,
    picture: el => !!el.profile_picture,
    picture_file: el =>  el.profile_picture_file || null,
    // picture_base64: el => el.profile_picture,
    services: el => el.services
      
  }
}

function getAddressBook (backup, extract) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(backup.getFileID('Library/AddressBook/AddressBook.sqlitedb'))
      .then(db => {
        // Query basic Address Book fields
        const query = `
      select ABPerson.ROWID
          , ABPerson.first
          , ABPerson.middle
          , ABPerson.last
          , ABPerson.Organization as organization
          , ABPerson.Department as department
          , ABPerson.Birthday as birthday
          , ABPerson.JobTitle as jobtitle
          , ${apple_timestamp.parse('ABPerson.CreationDate')} as created_date 
          , ${apple_timestamp.parse('ABPerson.ModificationDate')} as updated_date 
          , (select value from ABMultiValue where property = 3 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = '_$!<Work>!$_')) as phone_work
          , (select value from ABMultiValue where property = 3 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = '_$!<Mobile>!$_')) as phone_mobile
          , (select value from ABMultiValue where property = 3 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = '_$!<Home>!$_')) as phone_home

          , (select value from ABMultiValue where property = 4 and record_id = ABPerson.ROWID) as email
          
          , (select value from ABMultiValueEntry where parent_id in (select ROWID from ABMultiValue where record_id = ABPerson.ROWID) and key = (select ROWID from ABMultiValueEntryKey where lower(value) = 'street')) as address
          , (select value from ABMultiValueEntry where parent_id in (select ROWID from ABMultiValue where record_id = ABPerson.ROWID) and key = (select ROWID from ABMultiValueEntryKey where lower(value) = 'city')) as city
          , ABPerson.Note as note
        from ABPerson
      order by ABPerson.ROWID
      `
        db.all(query, async function (err, rows) {
          if (err) reject(err)
          const iterateElements = (elements, index, callback) => {
            if (index === elements.length) { return callback() }
            // do parse call with element
            let ele = elements[index]
            // Query username and profile links for other services (facebook etc)
            const query = `
          select (select value from ABMultiValue where property = 22 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = 'PROFILE')) as google_profile
              , (select value from ABMultiValue where property = 22 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = 'profile')) as google_profile1
              , (select value from ABMultiValue where property = 4 and record_id = ABPerson.ROWID and label = (select ROWID from ABMultiValueLabel where value = 'iCloud')) as icloud
              
              , (select value from ABMultiValueEntry where parent_id in (select ROWID from ABMultiValue where record_id = ABPerson.ROWID) and key = (select ROWID from ABMultiValueEntryKey where lower(value) = 'service')) as service
              , (select value from ABMultiValueEntry where parent_id in (select ROWID from ABMultiValue where record_id = ABPerson.ROWID) and key = (select ROWID from ABMultiValueEntryKey where lower(value) = 'username')) as username
              , (select value from ABMultiValueEntry where parent_id in (select ROWID from ABMultiValue where record_id = ABPerson.ROWID) and key = (select ROWID from ABMultiValueEntryKey where lower(value) = 'url')) as url
            from ABPerson
            where ABPerson.ROWID = ${ele.ROWID}
          order by ABPerson.ROWID
          `
            db.all(query, async function (err, rows1) {
              if (err) return reject(err)
              rows1[0].google_profile = rows1[0].google_profile || rows1[0].google_profile1
              delete rows1[0].google_profile1
              ele.services = rows1[0]

              backup.openDatabase(backup.getFileID('Library/AddressBook/AddressBookImages.sqlitedb'))
                .then(imageDB => {
                  // Query profile picture extraction from /Library/AddressBook/AddressBookImages.sqlitedb
                  const query = `
                  select data
                  from ABFullSizeImage
                    where ABFullSizeImage.record_id = ${ele.ROWID}
                  `
                  imageDB.get(query, async function (err, row) {
                    if (err) return reject(err)
                    ele.profile_picture = null
                    if (row) {
                      ele.profile_picture = (row.data || '').toString('base64')
                        if (extract && row.data) {
                            fs.ensureDir(path.dirname(extract)).then( (err) => {
                                var outFile = path.join(extract, `profile_picture_${ele.ROWID}.jpg`)
                
                                // Log the export
                                log.verbose('extract', outFile)
                
                                fs.writeFile(outFile, row.data, (err) => {
                                    if (err) console.log(err);
                                })
                                ele.profile_picture_file = outFile                            
                            })
                        }
                    }
                    iterateElements(elements, index + 1, callback)
                  })
                })
                .catch(reject)
            })
          }
          iterateElements(rows, 0, () => {
            resolve(rows)
          })
        })
      })
      .catch(reject)
  })
}

function extractProfilePictures (items, extractDest) {
    // Ensure output dir exists
    fs.ensureDir(path.dirname(extractDest)).then( (err) => {
        if (err) console.log(err)
        for (let item of items) {
            if (item.profile_picture) {
                var outFile = path.join(extractDest, `profile_picture_${item.ROWID}.jpg`)
                
                // Log the export
                log.verbose('extract', outFile)
                
                fs.writeFile(outFile, Buffer.from(item.profile_picture, 'base64'), (err) => {
                    if (err) console.log(err);
                })
                item.profile_picture_file = outFile
            }
        }
    })    
}
