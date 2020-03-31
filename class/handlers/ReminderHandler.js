const util = require.main.require('./util');
const Discord = require.main.require('./discordjs_amends');

const enums = require.main.require('./enum');
const { colors, reactionEvents } = enums;

const Reminder = require.main.require('./class/Reminder');
const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class ReminderHandler extends ClientBasedHandler {

    path;
    reminders;
    running;

    constructor(client, path) {
        super(client);
        this.path = path;
        this.reminders = new Discord.Collection();
        this.running = new Discord.Collection();
    }

    /**
     * Formats the list of cached reminders into a save-able form
     */
    formatAll() {
        let shortReminders = new Discord.Collection();
        this.reminders.forEach((reminder, id) => {
            shortReminders.set(id, reminder.format());
        });
        return shortReminders;
    }

    /**
     * Gets a collection of all reminders including its real message values
     * @returns {Promise<Discord.Collection<*,*>>}
     */
    async readAll() {
        this.client.logger.debug('Reading all saved reminders...');
        let binaryReminders = this.client.fileHandler.load(this.path);
        let collection = new Discord.Collection();
        for (let reminderEntry of binaryReminders) {
            let jsonReminder = reminderEntry[1];

            // Convert old entries to use larger, but easier to use shorthand message format instead of just the ID
            if (typeof jsonReminder.userMsg == 'string') {
                jsonReminder.userMsg = await client.getFixedMessage(jsonReminder.userMsg);
            }
            let userMsg = await this.getReminderMsg(jsonReminder.userMsg);

            let botMsg;
            if (jsonReminder.botMsg == null) {
                botMsg = null;
            } else {
                // Convert old entries to use larger, but easier to use shorthand message format instead of just the ID
                if (typeof jsonReminder.botMsg == 'string') {
                    jsonReminder.botMsg = await client.getFixedMessage(jsonReminder.botMsg);
                }
                botMsg = await this.getReminderMsg(jsonReminder.botMsg);
            }

            let date = new Date(jsonReminder.date);
            let task = jsonReminder.task;
            let id = reminderEntry[0];

            let users = [];

            if (jsonReminder.users) {
                for (let userEntry of jsonReminder.users) {
                    let user = this.client.users.get(userEntry);
                    users.push(user);
                }
            }

            let reminder = new Reminder(
                userMsg, date, task, botMsg, id, users
            );
            collection.set(id, reminder);
        }
        this.client.logger.debug('Done!');
        return collection;
    }

    /**
     * Loads all reminders into cache
     */
    async loadAll() {
        let collection = await this.readAll();
        collection.forEach(reminder => {
            this.add(reminder);
        });
        this.client.logger.debug('Loaded all reminders.');
    }

    /**
     * Adds a reminder to the list
     * @param reminder
     */
    add(reminder) {
        this.reminders.set(reminder.id, reminder);
        this.saveAll();
    }

    saveAll() {
        this.client.fileHandler.save(this.path, Array.from(this.formatAll()));
    }

    /**
     * Starts all reminders
     */
    startAll() {
        this.reminders.forEach(reminder => {
            this.start(reminder);
        });
        this.client.logger.debug('Started all reminder timers.');
    }

    /**
     * Starts the reminder timer
     * @returns {boolean}
     */
    async start(reminder) {
        if (!this.runTimer(reminder)) {
            this.client.logger.info('Reminder with id ' + reminder.id + ' could not be started.');
            return false;
        }
        this.client.logger.debug('Started reminder with id ' + reminder.id + '.');

        if (reminder.botMsg == null) {
            this.client.logger.info('Reminder with id ' + reminder.id + ' doesn\'t have a bot message.');
            return true;
        }

        let channel = this.client.channels.get(reminder.botMsg.channel.id);
        let botMsg;
        try {
            botMsg = await channel.fetchMessage(reminder.botMsg.id);
        } catch (e) {
            this.client.logger.info('Could not fetch bot message of reminder with id ' + reminder.id + '.');
            reminder.botMsg = null;
            this.reminders.set(reminder.id, this);
            this.saveAll();
            return true;
        }
        this.client.reactionListenerHandler.add(botMsg, (messageReaction, reactor, event) => {
            if (event === reactionEvents.ADD) {
                this.addUser(reminder, reactor);
            } else if (event === reactionEvents.REMOVE) {
                this.removeUser(reminder, reactor);
            }
        }, [ this.client.reactionListenerHandler.REMINDER_SIGNUP_EMOJI ]);

        this.client.logger.debug('Added listener to bot message of reminder with id ' + reminder.id + '.');
        return true;
    }

    addUser(reminder, user) {
        if (reminder.addUser(user)) {
            this.client.logger.log(user + ' joined reminder ' + reminder.id + '.');
        }
        this.saveAll();
    }

    removeUser(reminder, user) {
        if (reminder.removeUser(user)) {
            this.client.logger.log(user + ' left reminder ' + reminder.id + '.');
        }
        this.saveAll();
    }

    /**
     * Deletes a reminder
     * @param {Reminder} reminder
     */
    delete(reminder) {
        this.stop(reminder);
        this.reminders.delete(reminder.id);
        this.saveAll();
        this.client.logger.debug('Deleted reminder with id ' + reminder.id + '.');
    }

    /**
     * Stops a reminder timer
     * @param {Reminder} reminder
     */
    stop(reminder) {
        let timerEntry = this.running.get(reminder.id);
        clearInterval(timerEntry);
        this.running.delete(reminder.id);
        this.client.logger.debug('Stopped timer of reminder with id ' + reminder.id + '.');
    }

    /**
     * Triggers the reminder
     * @param {Reminder} reminder
     */
    trigger(reminder) {
        reminder.trigger();
        this.client.logger.debug('Triggered reminder with id ' + reminder.id + '.');
        this.delete(reminder);
    }

    /**
     * Recursive running function to handle times larger than the 32-bit signed positive integer limit in milliseconds
     * @param {Reminder} reminder
     * @param {Date} started
     */
    runTimer(reminder, started = new Date()) {
        let me = this;
        let now = new Date();
        let future = new Date(reminder.date);
        let diff = future - now;
        if (diff < 0) {
            this.client.logger.info('Reminder with id ' + reminder.id + ' has its starting point in the past. Deleting.');
            this.delete(reminder);
            return false;
        }
        let timer;
        if (diff > 0x7FFFFFFF) {
            timer = setTimeout(function() {
                me.runTimer(reminder, started);
            });
        } else {
            timer = setTimeout(function() {
                me.trigger(reminder);
            }, diff);
        }
        this.running.set(reminder.id, timer);
        return true;
    }

    /**
     * Returns a collection of reminders in which the user appears inside the optionally provided collection of reminders
     * @param user
     * @param collection
     * @returns {Collection<Snowflake, Object>}
     */
    getRemindersOfUser(user, collection = this.reminders) {
        return collection.filter(value => {
            return value.users.includes(user);
        });
    }

    /**
     * Sends notifications for the expired reminders inside the collection
     * @param collection
     * @returns {Promise<void>}
     */
    async notifyOld(collection) {
        let usersWithOldReminders = this.getUsersWithReminders(collection);
        for (const userEntry of usersWithOldReminders) {
            let user = userEntry[1];
            let oldReminders = this.getRemindersOfUser(user, collection);
            let tempText = 'I wasn\'t able to remind you of these messages:\n';
            for (const reminderEntry of oldReminders) {
                let reminder = reminderEntry[1];
                let realDate = new Date(reminder.date);
                tempText += '[' + util.parseDate(realDate);
                if (reminder.task != null) {
                    tempText += ' - ' + reminder.task;
                }
                tempText += '](<' + reminder.userMsg.getLink() + '>)';
                if (reminder !== oldReminders.last()) {
                    tempText += '\n';
                }
            }
            let embed = new Discord.RichEmbed()
                .setColor(colors.RED)
                .setTitle('Sorry!')
                .setDescription(tempText);
            let channel = await user.getDmChannel();
            channel.send({ embed: embed });
        }
    }

    /**
     * Filters all reminders to remove expired reminders. Creates a collection for these expired reminders
     */
    filterReminders() {
        let now = new Date();
        let amt = 0;
        let filtered = this.reminders.filter(reminder => {
            let bool = (new Date(reminder.date) <= now);
            if (bool) amt++;
            return bool;
        });
        this.reminders = this.reminders.filter(reminder => {
            return (new Date(reminder.date) > now);
        });
        this.client.logger.debug(`Removed ${amt} outdated reminders.`);
        this.notifyOld(filtered).catch(console.error);
        this.saveAll();
    }

    /**
     * Returns a collection of users that are signed up for the reminders in the reminder collection
     * @param collection
     * @returns {Collection<Snowflake, User>}
     */
    getUsersWithReminders(collection = this.reminders) {
        let users = new Discord.Collection();
        collection.forEach(reminder => {
            for (let i = 0; i < reminder.users.length; i++) {
                let user = reminder.users[i];
                if (!users.has(user.id)) {
                    users.set(user.id, user);
                }
            }
        });
        return users;
    }

    /**
     * Removes a user from the list of users of all reminders
     * @param user
     */
    leaveAll(user) {
        let userReminders = this.getRemindersOfUser(user);
        userReminders.forEach(reminder => {
            reminder.removeUser(user);
        });
        this.saveAll();
    }

    /**
     * Helper method to get a message from a reminder message entry
     * @param {Object} msgEntry
     * @returns {Promise<*>}
     */
    async getReminderMsg(msgEntry) {
        let msgId = msgEntry.id;
        let msgChannelEntry = msgEntry.channel;
        if (msgChannelEntry.type === 'dm') {
            if (!msgChannelEntry.hasOwnProperty('recipient')) {
                msgChannelEntry.recipient = {};
                let recipient = await this.client.findRecipientOfDmChannelId(msgChannelEntry.id);
                msgChannelEntry.recipient.id = recipient.id;
            }
        }
        return await this.client.getMessageInChannelEntry(msgId, msgChannelEntry);
    }

}

module.exports = ReminderHandler;
