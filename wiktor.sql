create table if not exists channels
(
    id   integer
        constraint channels_pk
            primary key,
    type text
);

create unique index if not exists channels_id_uindex
    on channels (id);

create table if not exists reminders
(
    id            integer
        constraint reminders_pk
            primary key autoincrement,
    userMessageId integer,
    botMessageId  integer,
    date          text,
    task          text
);

create unique index if not exists reminders_id_uindex
    on reminders (id);

create table if not exists users
(
    id            integer
        constraint users_pk
            primary key,
    wednesday     integer default 0,
    name          text,
    discriminator integer,
    hasInteracted integer default 0
);

create table if not exists dm_channels
(
    id          integer
        constraint dm_channels_pk
            primary key
        references channels,
    recipientId integer
        references users
);

create unique index if not exists dm_channels_id_uindex
    on dm_channels (id);

create table if not exists messages
(
    id             integer
        constraint messages_pk
            primary key,
    authorId       integer
        references users,
    channelId      integer
        references channels,
    deleted        integer default 0,
    deletedContent text
);

create table if not exists message_attachments
(
    id        integer
        constraint message_attachments_pk
            primary key autoincrement,
    messageId integer
        references messages,
    filename  text,
    filesize  integer,
    url       text,
    proxyURL  text
);

create unique index if not exists message_attachments_id_uindex
    on message_attachments (id);

create table if not exists message_edits
(
    id         integer
        constraint message_edits_pk
            primary key autoincrement,
    messageId  integer
        references messages,
    oldContent text,
    newContent text,
    date       text
);

create unique index if not exists message_edits_id_uindex
    on message_edits (id);

create table if not exists message_embeds
(
    id        integer
        constraint message_embeds_pk
            primary key autoincrement,
    messageId integer
        references messages,
    data      text
);

create unique index if not exists message_embeds_id_uindex
    on message_embeds (id);

create unique index if not exists messages_id_uindex
    on messages (id);

create table if not exists servers
(
    id                 integer
        constraint servers_pk
            primary key,
    ownerId            integer
        references users,
    wednesday          integer default 0,
    wednesdayChannelId integer,
    name               text
);

create table if not exists server_admins
(
    userId   integer
        references users,
    serverId integer
        references servers
);

create unique index if not exists server_admins_uindex
    on server_admins (userId, serverId);

create unique index if not exists servers_id_uindex
    on servers (id);

create table if not exists text_channels
(
    id       integer
        constraint text_channels_pk
            primary key,
    serverId integer
        references servers,
    name     text
);

create unique index if not exists text_channels_id_uindex
    on text_channels (id);

create table if not exists user_reminder_relations
(
    userId     integer
        references users,
    reminderId integer
        references reminders
);

create unique index if not exists users_id_uindex
    on users (id);

create table if not exists water_timers
(
    id       integer
        constraint water_timers_pk
            primary key autoincrement,
    userId   integer
        references users,
    interval integer default 60,
    lastDate text,
    nextDate text,
    missed   integer default 0
);

create unique index if not exists water_timers_id_uindex
    on water_timers (id);

