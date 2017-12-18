CREATE TABLE _SqliteDatabaseProperties (key TEXT,
    value TEXT,
    UNIQUE(key)
);

CREATE TABLE deleted_messages (
    ROWID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    guid TEXT NOT NULL
);

CREATE TABLE sqlite_sequence( name, seq);

CREATE TABLE chat_handle_join (
    chat_id INTEGER REFERENCES chat (ROWID) ON DELETE CASCADE,
    handle_id INTEGER REFERENCES handle (ROWID) ON DELETE CASCADE,
    UNIQUE(chat_id,
    handle_id)
);

CREATE TABLE chat_message_join (
    chat_id INTEGER REFERENCES chat (ROWID) ON DELETE CASCADE,
    message_id INTEGER REFERENCES message (ROWID) ON DELETE CASCADE,
    PRIMARY KEY (chat_id,
    message_id)
);

CREATE TABLE message_attachment_join (
    message_id INTEGER REFERENCES message (ROWID) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES attachment (ROWID) ON DELETE CASCADE,
    UNIQUE(message_id,
    attachment_id)
);

CREATE TABLE handle (
    ROWID INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    id TEXT NOT NULL,
    country TEXT,
    service TEXT NOT NULL,
    uncanonicalized_id TEXT,
    UNIQUE (id,
    service) 
);

CREATE TABLE message (
    ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE NOT NULL,
    text TEXT,
    replace INTEGER DEFAULT 0,
    service_center TEXT,
    handle_id INTEGER DEFAULT 0,
    subject TEXT,
    country TEXT,
    attributedBody BLOB,
    version INTEGER DEFAULT 0,
    type INTEGER DEFAULT 0,
    service TEXT,
    account TEXT,
    account_guid TEXT,
    error INTEGER DEFAULT 0,
    date INTEGER,
    date_read INTEGER,
    date_delivered INTEGER,
    is_delivered INTEGER DEFAULT 0,
    is_finished INTEGER DEFAULT 0,
    is_emote INTEGER DEFAULT 0,
    is_from_me INTEGER DEFAULT 0,
    is_empty INTEGER DEFAULT 0,
    is_delayed INTEGER DEFAULT 0,
    is_auto_reply INTEGER DEFAULT 0,
    is_prepared INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    is_system_message INTEGER DEFAULT 0,
    is_sent INTEGER DEFAULT 0,
    has_dd_results INTEGER DEFAULT 0,
    is_service_message INTEGER DEFAULT 0,
    is_forward INTEGER DEFAULT 0,
    was_downgraded INTEGER DEFAULT 0,
    is_archive INTEGER DEFAULT 0,
    cache_has_attachments INTEGER DEFAULT 0,
    cache_roomnames TEXT,
    was_data_detected INTEGER DEFAULT 0,
    was_deduplicated INTEGER DEFAULT 0,
    is_audio_message INTEGER DEFAULT 0,
    is_played INTEGER DEFAULT 0,
    date_played INTEGER,
    item_type INTEGER DEFAULT 0,
    other_handle INTEGER DEFAULT 0,
    group_title TEXT,
    group_action_type INTEGER DEFAULT 0,
    share_status INTEGER DEFAULT 0,
    share_direction INTEGER DEFAULT 0,
    is_expirable INTEGER DEFAULT 0,
    expire_state INTEGER DEFAULT 0,
    message_action_type INTEGER DEFAULT 0,
    message_source INTEGER DEFAULT 0,
    associated_message_guid STRING DEFAULT NULL,
    balloon_bundle_id STRING DEFAULT NULL,
    payload_data BLOB,
    associated_message_type INTEGER DEFAULT 0,
    expressive_send_style_id STRING DEFAULT NULL,
    associated_message_range_location INTEGER DEFAULT 0,
    associated_message_range_length INTEGER DEFAULT 0,
    time_expressive_send_played INTEGER DEFAULT 0,
    message_summary_info BLOB DEFAULT NULL
);

CREATE TABLE chat (
    ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE NOT NULL,
    style INTEGER,
    state INTEGER,
    account_id TEXT,
    properties BLOB,
    chat_identifier TEXT,
    service_name TEXT,
    room_name TEXT,
    account_login TEXT,
    is_archived INTEGER DEFAULT 0,
    last_addressed_handle TEXT,
    display_name TEXT,
    group_id TEXT,
    is_filtered INTEGER,
    successful_query INTEGER
);

CREATE TABLE attachment (
    ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE NOT NULL,
    created_date INTEGER DEFAULT 0,
    start_date INTEGER DEFAULT 0,
    filename TEXT,
    uti TEXT,
    mime_type TEXT,
    transfer_state INTEGER DEFAULT 0,
    is_outgoing INTEGER DEFAULT 0,
    user_info BLOB,
    transfer_name TEXT,
    total_bytes INTEGER DEFAULT 0,
    is_sticker INTEGER DEFAULT 0,
    sticker_user_info BLOB,
    attribution_info BLOB,
    hide_attachment INTEGER DEFAULT 0
);