/*
  ℹ SQL file for the initial setup of the database
 */

/* USERS */
CREATE TABLE IF NOT EXISTS users
(
    id integer constraint users_pk primary key
);
CREATE UNIQUE INDEX users_id_uindex on users (id);

/* SERVERS */
CREATE TABLE IF NOT EXISTS servers
(
    id integer constraint servers_pk primary key
);
CREATE UNIQUE INDEX servers_id_uindex on servers (id);

/* WATER TIMERS */
CREATE TABLE IF NOT EXISTS water_timers
(
	id integer constraint water_timers_pk primary key autoincrement,
	userId integer constraint water_timers_users_id_fk references users
);
CREATE UNIQUE INDEX waterTimers_id_uindex on water_timers (id);

/* SERVER ADMINS */
CREATE TABLE IF NOT EXISTS server_admins
(
    userId integer constraint serverAdmins_users_id_fk references users,
    serverId integer constraint serverAdmins_servers_id_fk references servers
);

/* REMINDERS */
CREATE TABLE IF NOT EXISTS reminders
(
    id integer constraint reminders_pk primary key autoincrement,
    userMessageId integer,
    botMessageId integer,
    date text,
    task text
);
CREATE UNIQUE INDEX reminders_id_uindex on reminders (id);

/* USER X REMINDER CROSS TABLE */
CREATE TABLE IF NOT EXISTS user_reminder_relations
(
	userId integer constraint user_reminder_relations_users_id_fk references users,
	reminderId integer constraint user_reminder_relations_reminders_id_fk references reminders
);

/* CHANNELS */
CREATE TABLE IF NOT EXISTS channels
(
	id integer constraint channels_pk primary key,
	name text,
	serverId integer constraint channels_servers_id_fk references servers
);
CREATE UNIQUE INDEX channels_id_uindex on channels (id);

/* DELETED MESSAGES */
CREATE TABLE IF NOT EXISTS deleted_messages
(
	id integer constraint deleted_messages_pk primary key,
	content text,
	authorId integer references users,
	channelId integer constraint deleted_messages_channels_id_fk references channels
);
CREATE UNIQUE INDEX deleted_messages_id_uindex on deleted_messages (id);

/* EDITED MESSAGES */
CREATE TABLE IF NOT EXISTS edited_messages
(
	messageId integer,
	oldContent text,
	newContent text,
	authorId integer references users,
	channelId integer references channels,
	id integer constraint edited_messages_pk primary key autoincrement
);
CREATE UNIQUE INDEX edited_messages_id_uindex on edited_messages (id);

/* WEDNESDAYS */
CREATE TABLE IF NOT EXISTS wednesdays
(
	serverId integer references servers,
	channelId integer references channels,
	enabled integer,
	userId integer constraint wednesdays_users_id_fk references users
);
CREATE UNIQUE INDEX wednesdays_channelId_uindex on wednesdays (channelId);
CREATE UNIQUE INDEX wednesdays_serverId_uindex on wednesdays (serverId);
CREATE UNIQUE INDEX wednesdays_userId_uindex on wednesdays (userId);
