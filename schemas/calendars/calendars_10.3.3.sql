CREATE TABLE _SqliteDatabaseProperties (key TEXT,
    value TEXT,
    UNIQUE(key));
CREATE TABLE Store (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    default_alarm_offset INTEGER,
    type INTEGER,
    constraint_path TEXT,
    disabled INTEGER,
    external_id TEXT,
    persistent_id TEXT,
    flags INTEGER,
    creator_bundle_id TEXT,
    creator_code_signing_identity TEXT,
    only_creator_can_modify INTEGER,
    external_mod_tag TEXT,
    preferred_event_private_value INTEGER,
    strictest_event_private_value INTEGER);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE StoreChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER);
CREATE TRIGGER delete_store_members AFTER DELETE ON Store
BEGIN
DELETE FROM Calendar WHERE store_id = OLD.ROWID;
END;
CREATE TRIGGER delete_store_changes AFTER DELETE ON Store
BEGIN
DELETE FROM CalendarChanges WHERE store_id = OLD.ROWID;DELETE FROM CalendarItemChanges WHERE store_id = OLD.ROWID;DELETE FROM AlarmChanges WHERE store_id = OLD.ROWID;DELETE FROM RecurrenceChanges WHERE store_id = OLD.ROWID;DELETE FROM ParticipantChanges WHERE store_id = OLD.ROWID;
END;
CREATE INDEX StoreExternalId on Store(external_id);
CREATE TABLE Calendar (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    title TEXT,
    flags INTEGER,
    color TEXT,
    symbolic_color_name TEXT,
    color_is_display INTEGER,
    type TEXT,
    supported_entity_types INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    external_id_tag TEXT,
    external_rep BLOB,
    display_order INTEGER,
    UUID TEXT,
    shared_owner_name TEXT,
    shared_owner_email TEXT,
    sharing_status INTEGER,
    sharing_invitation_response INTEGER,
    published_URL TEXT,
    is_published INTEGER,
    invitation_status INTEGER,
    sync_token TEXT,
    self_identity_id INTEGER,
    self_identity_email TEXT,
    owner_identity_id INTEGER,
    owner_identity_email TEXT,
    notes TEXT,
    bulk_requests BLOB,
    subcal_account_id TEXT,
    push_key TEXT,
    digest BLOB);
CREATE TABLE CalendarChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    store_id INTEGER,
    flags INTEGER,
    external_id TEXT,
    external_id_tag TEXT,
    UUID TEXT);
CREATE INDEX CalendarExternalId on Calendar(external_id);
CREATE INDEX CalendarStoreId on Calendar(store_id);
CREATE INDEX CalendarUUID on Calendar(UUID);
CREATE INDEX CalendarSelfIdentityId on Calendar(self_identity_id);
CREATE TRIGGER delete_calendar_members AFTER DELETE ON Calendar
BEGIN
DELETE FROM OccurrenceCacheDays where calendar_id = OLD.ROWID;DELETE FROM OccurrenceCache where calendar_id = OLD.ROWID;DELETE FROM CalendarItem WHERE calendar_id = OLD.ROWID;DELETE FROM OccurrenceCacheDays WHERE count = 0;DELETE FROM Notification WHERE calendar_id = OLD.ROWID; DELETE FROM sharee where owner_id = OLD.ROWID;DELETE FROM Alarm WHERE calendar_owner_id = OLD.ROWID;
END;
CREATE TABLE Recurrence (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    frequency INTEGER,
    interval INTEGER,
    week_start INTEGER,
    count INTEGER,
    cached_end_date REAL,
    cached_end_date_tz TEXT,
    end_date REAL,
    specifier TEXT,
    by_month_months INTEGER,
    owner_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    external_id_tag TEXT,
    external_rep BLOB,
    UUID TEXT);
CREATE TABLE RecurrenceChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    external_id TEXT,
    store_id INTEGER,
    event_id_tomb INTEGER,
    calendar_id INTEGER,
    end_date_tomb REAL,
    UUID TEXT);
CREATE INDEX RecurrenceEndCountIndex on Recurrence(end_date,
    count);
CREATE INDEX RecurrenceExternalId on Recurrence(external_id);
CREATE INDEX RecurrenceOwnerIdIndex on Recurrence(owner_id);
CREATE INDEX RecurrenceUUID on Recurrence(UUID);
CREATE TABLE Alarm (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_date REAL,
    trigger_interval INTEGER,
    type INTEGER,
    calendaritem_owner_id INTEGER,
    calendar_owner_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    external_id_tag TEXT,
    external_rep BLOB,
    UUID TEXT,
    proximity INTEGER,
    disabled INTEGER,
    location_id INTEGER,
    acknowledgedDate REAL,
    default_alarm INTEGER,
    orig_alarm_id INTEGER);
CREATE TABLE AlarmChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    calendaritem_owner_id INTEGER,
    calendar_owner_id INTEGER,
    external_id TEXT,
    store_id INTEGER,
    calendar_id INTEGER,
    UUID TEXT);
CREATE INDEX AlarmExternalId on Alarm(external_id);
CREATE INDEX AlarmUUID on Alarm(UUID);
CREATE INDEX AlarmTriggerDate on Alarm(trigger_date);
CREATE INDEX AlarmCalendarItemOwnerId on Alarm(calendaritem_owner_id);
CREATE INDEX AlarmCalendarOwnerId on Alarm(calendar_owner_id);
CREATE TRIGGER cascade_alarm_delete AFTER DELETE ON Alarm
BEGIN
DELETE FROM Location WHERE alarm_owner_id = OLD.ROWID;
END;
CREATE TABLE Participant (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type INTEGER,
    type INTEGER,
    status INTEGER,
    pending_status INTEGER,
    role INTEGER,
    identity_id INTEGER,
    owner_id INTEGER,
    external_rep BLOB,
    UUID TEXT,
    email TEXT,
    is_self INTEGER,
    comment TEXT,
    schedule_agent INTEGER,
    flags INTEGER,
    last_modified REAL,
    proposed_start_date REAL,
    invited_by TEXT,
    proposed_start_date_status INTEGER,
    comment_last_modified REAL);
CREATE TABLE ParticipantChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    entity_type INTEGER,
    owner_id INTEGER,
    UUID TEXT,
    email TEXT,
    comment TEXT,
    store_id INTEGER,
    calendar_id INTEGER);
CREATE INDEX ParticipantUUID on Participant(UUID);
CREATE INDEX ParticipantEntityType on Participant(entity_type);
CREATE INDEX ParticipantOwnerId on Participant(owner_id);
CREATE INDEX ParticipantIdentityId on Participant(identity_id);
CREATE INDEX ParticipantEmail on Participant(email);
CREATE TABLE Identity (display_name TEXT,
    address TEXT,
    first_name TEXT,
    last_name TEXT,
    UNIQUE (display_name,
    address,
    first_name,
    last_name));
CREATE TABLE EventAction (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    external_folder_id TEXT,
    external_schedule_id TEXT,
    external_rep BLOB);
CREATE TABLE EventActionChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    event_id INTEGER,
    external_id TEXT,
    external_folder_id TEXT,
    external_schedule_id TEXT,
    store_id INTEGER,
    calendar_id INTEGER);
CREATE INDEX EventActionEventId on EventAction(event_id);
CREATE INDEX EventActionExternalId on EventAction(external_id);
CREATE INDEX EventActionFolderId on EventAction(external_folder_id);
CREATE TABLE CalendarItem (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT,
    location_id INTEGER,
    client_location_id INTEGER,
    description TEXT,
    start_date REAL,
    start_tz TEXT,
    end_date REAL,
    end_tz TEXT,
    all_day INTEGER,
    calendar_id INTEGER,
    orig_item_id INTEGER,
    orig_date REAL,
    organizer_id INTEGER,
    self_attendee_id INTEGER,
    status INTEGER,
    invitation_status INTEGER,
    availability INTEGER,
    privacy_level INTEGER,
    url TEXT,
    last_modified REAL,
    sequence_num INTEGER,
    birthday_id INTEGER,
    modified_properties INTEGER,
    external_tracking_status INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    unique_identifier TEXT,
    external_schedule_id TEXT,
    external_rep BLOB,
    response_comment TEXT,
    last_synced_response_comment TEXT,
    hidden INTEGER,
    has_recurrences INTEGER,
    has_attendees INTEGER,
    UUID TEXT,
    entity_type INTEGER,
    priority INTEGER,
    due_date REAL,
    due_tz TEXT,
    due_all_day INTEGER,
    completion_date REAL,
    creation_date REAL,
    conference TEXT,
    app_link BLOB,
    display_order INTEGER,
    created_by_id INTEGER,
    modified_by_id INTEGER,
    shared_item_created_date REAL,
    shared_item_created_tz TEXT,
    shared_item_modified_date REAL,
    shared_item_modified_tz TEXT,
    invitation_changed_properties INTEGER,
    default_alarm_removed INTEGER,
    phantom_master INTEGER,
    participation_status_modified_date REAL,
    calendar_scale TEXT,
    travel_time INTEGER,
    travel_advisory_behavior INTEGER,
    start_location_id INTEGER,
    suggested_event_info_id INTEGER,
    first_alert_date REAL,
    proposed_start_date REAL,
    can_forward INTEGER,
    location_prediction_state INTEGER,
    fired_ttl INTEGER,
    disallow_propose_new_time INTEGER,
    junk_status INTEGER);
CREATE TABLE CalendarItemChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    calendar_id INTEGER,
    external_id TEXT,
    unique_identifier TEXT,
    UUID TEXT,
    entity_type INTEGER,
    store_id INTEGER,
    has_dirty_instance_attributes INTEGER,
    old_calendar_id INTEGER,
    old_external_id TEXT);
CREATE INDEX EventStatus on CalendarItem(status);
CREATE INDEX EventHiddenEndDateStartDate on CalendarItem(hidden,
    end_date,
    start_date);
CREATE INDEX EventExternalIdCalId on CalendarItem(external_id,
    calendar_id);
CREATE INDEX EventExternalUniqueIdentifierCalId on CalendarItem(unique_identifier,
    calendar_id);
CREATE INDEX EventUUID on CalendarItem(UUID);
CREATE INDEX CalendarItemDueDate on CalendarItem(due_date);
CREATE INDEX CalendarItemEntityTypeCompletionDate on CalendarItem(entity_type,
    completion_date);
CREATE INDEX CalendarItemEntityTypeCalendarIdCompletionDateCreationDate on CalendarItem(entity_type,
    calendar_id,
    completion_date,
    creation_date);
CREATE INDEX EventInvitationStatus on CalendarItem(invitation_status);
CREATE INDEX CalendarItemOriginalItemId on CalendarItem(orig_item_id);
CREATE INDEX CalendarItemOriginalDate on CalendarItem(orig_date);
CREATE TRIGGER delete_event_alarms_recurs AFTER DELETE ON CalendarItem
BEGIN
DELETE FROM Location WHERE item_owner_id = OLD.ROWID;DELETE FROM Alarm WHERE calendaritem_owner_id = OLD.ROWID;DELETE FROM Recurrence WHERE owner_id = OLD.ROWID;DELETE FROM Participant WHERE owner_id = OLD.ROWID;DELETE FROM ExceptionDate WHERE owner_id = OLD.ROWID;DELETE FROM OccurrenceCache WHERE event_id = OLD.ROWID;DELETE FROM OccurrenceCacheDays WHERE count = 0;DELETE FROM Attachment WHERE owner_id = OLD.ROWID;DELETE FROM ScheduledTaskCache WHERE task_id = OLD.ROWID;DELETE FROM EventAction WHERE event_id = OLD.ROWID;DELETE FROM SuggestedEventInfo WHERE ROWID = OLD.suggested_event_info_id;
END;
CREATE TABLE ExceptionDate (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    date REAL,
    sync_order INTEGER);
CREATE INDEX ExceptionDateOwnerId on ExceptionDate(owner_id);
CREATE TABLE Attachment (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    external_rep BLOB,
    url TEXT,
    UUID TEXT,
    data BLOB,
    format TEXT,
    is_binary INTEGER,
    filename TEXT,
    local_url TEXT,
    file_size INTEGER);
CREATE TABLE AttachmentChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    owner_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    UUID TEXT,
    store_id INTEGER,
    calendar_id INTEGER);
CREATE INDEX AttachmentEventId on Attachment(owner_id);
CREATE INDEX AttachmentUUID on Attachment(UUID);
CREATE TABLE Category (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    entity_type INTEGER,
    hidden INTEGER);
CREATE UNIQUE INDEX CategoryNameAndType on Category(name,
    entity_type);
CREATE TABLE CategoryLink (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    category_id INTEGER);
CREATE INDEX OwnerID on CategoryLink(owner_id);
CREATE TABLE Location (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    address TEXT,
    latitude INTEGER,
    longitude INTEGER,
    reference_frame INTEGER,
    address_book_id TEXT,
    mapkit_handle BLOB,
    radius INTEGER,
    routing TEXT,
    derived_from TEXT,
    item_owner_id INTEGER,
    alarm_owner_id INTEGER);
CREATE INDEX LocationOwnerItemId on Location(item_owner_id);
CREATE TABLE Sharee (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    external_id TEXT,
    external_rep BLOB,
    UUID TEXT,
    identity_id INTEGER,
    status INTEGER,
    access_level INTEGER);
CREATE TABLE ShareeChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    owner_id INTEGER,
    UUID TEXT,
    status INTEGER,
    access_level INTEGER,
    display_name TEXT,
    address TEXT,
    store_id INTEGER,
    calendar_id INTEGER,
    first_name TEXT,
    last_name TEXT);
CREATE INDEX ShareeUUID on Sharee(UUID);
CREATE INDEX ShareeOwnerId on Sharee(owner_id);
CREATE INDEX ShareeStatus on Sharee(status);
CREATE INDEX ShareeAccessLevel on Sharee(access_level);
CREATE INDEX ShareeIdentityId on Sharee(identity_id);
CREATE TABLE Notification (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type INTEGER,
    calendar_id INTEGER,
    external_id TEXT,
    external_mod_tag TEXT,
    UUID TEXT,
    summary TEXT,
    creation_date REAL,
    last_modified REAL,
    status INTEGER,
    host_url TEXT,
    in_reply_to TEXT,
    identity_id INTEGER,
    alerted INTEGER);
CREATE TABLE NotificationChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    entity_type INTEGER,
    calendar_id INTEGER,
    external_id TEXT,
    UUID TEXT,
    store_id INTEGER);
CREATE INDEX NotificationUUIDCalendarId on Notification(UUID,
    calendar_id);
CREATE INDEX NotificationEntityType on Notification(entity_type);
CREATE INDEX NotificationExternalIDCalendarId on Notification(external_id,
    calendar_id);
CREATE INDEX NotificationCalendarId on Notification(calendar_id);
CREATE TRIGGER delete_resource_changes_for_notification AFTER DELETE ON Notification
BEGIN
DELETE FROM ResourceChange WHERE notification_id NOT IN (SELECT ROWID FROM Notification WHERE entity_type = 17 OR entity_type = 19);
END;
CREATE TABLE ResourceChange (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER,
    calendar_id INTEGER,
    calendar_item_id INTEGER,
    identity_id INTEGER,
    change_type INTEGER,
    timestamp REAL,
    changed_properties INTEGER,
    create_count INTEGER,
    update_count INTEGER,
    delete_count INTEGER,
    deleted_summary TEXT,
    deleted_start_date REAL,
    alerted INTEGER,
    public_status INTEGER);
CREATE INDEX ResourceChangeNotificationID on ResourceChange(notification_id);
CREATE INDEX ResourceChangeCalendarID on ResourceChange(calendar_item_id);
CREATE INDEX ResourceChangeCalendarItemID on ResourceChange(calendar_item_id);
CREATE INDEX ResourceChangeIdentityID on ResourceChange(identity_id);
CREATE TRIGGER delete_notification_calendar AFTER DELETE ON ResourceChange
BEGIN
DELETE FROM ResourceChange WHERE calendar_id NOT IN (SELECT ROWID FROM Calendar);
END;
CREATE TABLE SuggestedEventInfo (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    opaque_key TEXT,
    unique_key TEXT,
    changed_fields INTEGER,
    changes_acknowledged INTEGER,
    timestamp REAL);
CREATE INDEX SuggestedEventInfoOwnerId on SuggestedEventInfo(owner_id);
CREATE TABLE Contact (ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    contact_id TEXT);
CREATE TABLE ContactChanges (record INTEGER,
    type INTEGER,
    sequence_number INTEGER,
    owner_id INTEGER,
    contact_id TEXT,
    store_id INTEGER,
    calendar_id INTEGER);
CREATE INDEX ContactID on Contact(contact_id);
CREATE TABLE OccurrenceCache (day REAL,
    event_id INTEGER,
    calendar_id INTEGER,
    store_id INTEGER,
    occurrence_date REAL,
    occurrence_start_date REAL,
    occurrence_end_date REAL);
CREATE TABLE OccurrenceCacheDays (calendar_id INTEGER,
    store_id INTEGER,
    day REAL,
    count INTEGER,
    PRIMARY KEY (calendar_id,
    day));
CREATE TRIGGER update_cache_days_after_delete AFTER DELETE ON OccurrenceCache
BEGIN
UPDATE OccurrenceCacheDays SET count = count - 1 WHERE day = OLD.day AND calendar_id = OLD.calendar_id;UPDATE OccurrenceCacheDays SET count = count - 1 WHERE day = OLD.day AND calendar_id = -2;
END;
CREATE TRIGGER update_cache_days_after_insert AFTER INSERT ON OccurrenceCache
BEGIN
REPLACE INTO OccurrenceCacheDays VALUES (NEW.calendar_id,
    NEW.store_id,
    NEW.day,
    1 + IFNULL((SELECT count FROM OccurrenceCacheDays WHERE day = NEW.day AND calendar_id = NEW.calendar_id),
    0));
REPLACE INTO OccurrenceCacheDays VALUES (-2,
    -2,
    NEW.day,
    1 + IFNULL((SELECT count FROM OccurrenceCacheDays WHERE day = NEW.day AND calendar_id = -2),
    0));
END;
CREATE TRIGGER update_cache_days_after_update AFTER UPDATE OF day ON OccurrenceCache
BEGIN
REPLACE INTO OccurrenceCacheDays VALUES (NEW.calendar_id,
    NEW.store_id,
    NEW.day,
    1 + IFNULL((SELECT count FROM OccurrenceCacheDays WHERE day = NEW.day AND calendar_id = NEW.calendar_id),
    0));
REPLACE INTO OccurrenceCacheDays VALUES (-2,
    -2,
    NEW.day,
    1 + IFNULL((SELECT count FROM OccurrenceCacheDays WHERE day = NEW.day AND calendar_id = -2),
    0));
UPDATE OccurrenceCacheDays SET count = count - 1 WHERE day = OLD.day AND calendar_id = OLD.calendar_id;UPDATE OccurrenceCacheDays SET count = count - 1 WHERE day = OLD.day AND calendar_id = -2;
END;
CREATE INDEX OccurrenceCacheDayEventIdOccurrenceDate on OccurrenceCache(day,
    event_id,
    occurrence_date);
CREATE INDEX OccurrenceCacheOccurrenceDateEventId on OccurrenceCache(occurrence_date,
    event_id);
CREATE INDEX OccurrenceCacheCalendarId on OccurrenceCache(calendar_id);
CREATE INDEX OccurrenceCacheDaysCount on OccurrenceCacheDays(count);
CREATE INDEX OccurrenceCacheDaysDayCalendarId on OccurrenceCacheDays(day,
    calendar_id);
CREATE TABLE ScheduledTaskCache (day REAL,
    date_for_sorting REAL,
    completed INTEGER,
    task_id INTEGER,
    count INTEGER,
    PRIMARY KEY (day,
    task_id));
CREATE TRIGGER update_task_cache_count_after_insert AFTER INSERT ON ScheduledTaskCache
BEGIN
    REPLACE INTO ScheduledTaskCache VALUES (NEW.day,
    NULL,
    NULL,
    -2,
    1 + IFNULL((SELECT count FROM ScheduledTaskCache WHERE day = NEW.day AND task_id = -2),
    0));
END;
CREATE TRIGGER update_task_cache_count_after_update AFTER UPDATE OF day ON ScheduledTaskCache
BEGIN
    UPDATE ScheduledTaskCache SET count = count - 1 WHERE day = OLD.day AND task_id = -2;
    REPLACE INTO ScheduledTaskCache VALUES (NEW.day,
    NULL,
    NULL,
    -2,
    IFNULL((SELECT count FROM ScheduledTaskCache WHERE day = NEW.day AND task_id = -2),
    0));
    DELETE FROM ScheduledTaskCache WHERE day = OLD.day AND count = 0;
END;
CREATE TRIGGER update_task_cache_days_after_delete AFTER DELETE ON ScheduledTaskCache
BEGIN
    UPDATE ScheduledTaskCache SET count = count - 1 WHERE day = OLD.day AND task_id = -2;
    DELETE FROM ScheduledTaskCache WHERE day = OLD.day AND count = 0;
END;
CREATE INDEX ScheduledTaskCacheDayTaskId on ScheduledTaskCache(day);
CREATE INDEX ScheduledTaskCacheTaskId on ScheduledTaskCache(task_id);
CREATE TABLE ClientCursor (     ROWID INTEGER PRIMARY KEY AUTOINCREMENT,
        client_identifier TEXT,
        store_id INTEGER,
        latest_consumed_sequence_number INTEGER,
        latest_consumed_timestamp REAL,
        UNIQUE(client_identifier) );
CREATE INDEX ClientCursorClientIdentifier ON ClientCursor(client_identifier);
CREATE TABLE ClientSequence (client_identifier TEXT,
    sequence_number INTEGER );
CREATE INDEX ClientSequenceClientIdentifier ON ClientSequence(client_identifier);
CREATE TABLE ClientCursorConsumed (    client_identifier TEXT,
        consumed_entity_class INTEGER,
        consumed_entity_id INTEGER,
        consumed_change_id INTEGER,
        sequence_number INTEGER );
CREATE INDEX ClientCursorConsumedClientIdentifier ON ClientCursorConsumed(client_identifier);
CREATE TRIGGER delete_clientcursor_consumed AFTER DELETE ON ClientCursor     BEGIN         DELETE FROM ClientCursorConsumed WHERE client_identifier = OLD.client_identifier;         DELETE FROM ClientSequence WHERE client_identifier = OLD.client_identifier;     END;
