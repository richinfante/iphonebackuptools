
module.exports = {
  parse: (field_name) => {
    return `CASE WHEN (${field_name} > 1000000000) THEN datetime(${field_name} / 1000000000 + 978307200, 'unixepoch') 
                 WHEN ${field_name} <> 0 THEN datetime((${field_name} + 978307200), 'unixepoch') 
                 ELSE ${field_name} END`
  }
}
