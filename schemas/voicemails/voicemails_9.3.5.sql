CREATE TABLE _SqliteDatabaseProperties (key TEXT, value TEXT, UNIQUE(key));
CREATE TABLE voicemail (ROWID INTEGER PRIMARY KEY AUTOINCREMENT, remote_uid INTEGER, date INTEGER, token TEXT, sender TEXT, callback_num TEXT, duration INTEGER, expiration INTEGER, trashed_date INTEGER, flags INTEGER);
CREATE TABLE sqlite_sequence(name,seq);
CREATE INDEX date_index on voicemail(date);
CREATE INDEX remote_uid_index on voicemail(remote_uid);
