CREATE TABLE _SqliteDatabaseProperties (key TEXT,
    value TEXT,
    UNIQUE(key));
CREATE TABLE call (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT,
    date INTEGER,
    duration INTEGER,
    flags INTEGER,
    id INTEGER,
    name TEXT,
    country_code TEXT,
    network_code TEXT,
    read INTEGER,
    assisted INTEGER,
    face_time_data BLOB,
    originalAddress TEXT,
    answered INTEGER DEFAULT '1');
CREATE TABLE sqlite_sequence(name,seq);
CREATE INDEX date_index on call(date);
CREATE TRIGGER timer_last_trigger INSERT ON call WHEN (NEW.duration != 0) BEGIN UPDATE _SqliteDatabaseProperties SET value = (((NEW.duration + 59)/60)*60) WHERE key = 'timer_last'; END;
CREATE TRIGGER timer_outgoing_trigger INSERT ON call WHEN (NEW.flags & (1 << 0) == 1) BEGIN UPDATE _SqliteDatabaseProperties SET value = (((((SELECT NEW.duration)+59)/60)*60) + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'timer_outgoing')) WHERE key = 'timer_outgoing'; END;
CREATE TRIGGER timer_incoming_trigger INSERT ON call WHEN (NEW.flags & (1 << 0) == 0) BEGIN UPDATE _SqliteDatabaseProperties SET value = (((((SELECT NEW.duration)+59)/60)*60) + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'timer_incoming')) WHERE key = 'timer_incoming'; END;
CREATE TRIGGER timer_all_trigger INSERT ON call WHEN (NEW.duration != 0) BEGIN UPDATE _SqliteDatabaseProperties SET value = (((((SELECT NEW.duration) + 59)/60)*60) + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'timer_all')) WHERE key = 'timer_all'; END;
CREATE TRIGGER timer_lifetime_trigger INSERT ON call WHEN (NEW.duration != 0) BEGIN UPDATE _SqliteDatabaseProperties SET value = (((((SELECT NEW.duration) + 59)/60)*60) + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'timer_lifetime')) WHERE key = 'timer_lifetime'; END;
CREATE TRIGGER data_up_trigger UPDATE ON _SqliteDatabaseProperties WHEN (NEW.key = 'data_up_last') BEGIN UPDATE _SqliteDatabaseProperties SET value = (SELECT NEW.value + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'data_up_all')) WHERE key = 'data_up_all'; UPDATE _SqliteDatabaseProperties SET value = (SELECT NEW.value + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'data_up_lifetime')) WHERE key = 'data_up_lifetime'; END;
CREATE TRIGGER data_down_trigger UPDATE ON _SqliteDatabaseProperties WHEN (NEW.key = 'data_down_last') BEGIN UPDATE _SqliteDatabaseProperties SET value = (SELECT NEW.value + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'data_down_all')) WHERE key = 'data_down_all'; UPDATE _SqliteDatabaseProperties SET value = (SELECT NEW.value + (SELECT value FROM _SqliteDatabaseProperties WHERE key = 'data_down_lifetime')) WHERE key = 'data_down_lifetime'; END;
