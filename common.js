const fs = require('fs');
const { Discord, chrono, client } = require('./bot.js');

//// AMENDS
Number.prototype.pad = function(size) {
	let s = String(this);
	while (s.length < (size || 2)) s = '0' + s;
	return s;
};

// AMENDS TO DISCORD.JS LIBRARY
/**
 * Returns the database entry of the server
 * @returns {Object}
 */
Discord.Guild.prototype.getDbEntry = function() {
	if (!Storage.servers.hasOwnProperty(this.id)) throw 'Server with id ' + this.id + 'doesn\'t have an entry.';
	return Storage.servers[this.id];
};

/**
 * Returns the DM Channel of a user. Creates one if it does not exist.
 * @returns {Promise<DMChannel|undefined>}
 */
Discord.User.prototype.getDmChannel = async function() {
	if (this.bot) return undefined;
	return this.dmChannel != null ? this.dmChannel : await this.createDM();
};

/**
 * Sends a DM to a user without having to check for a DM channel first.
 * @param data
 * @returns {Promise<*>}
 */
Discord.User.prototype.sendDm = async function(data) {
	let channel = await this.getDmChannel();
	return channel.send(data);
};

/**
 * Returns the full handle (name, #, discriminator) of the user
 * @returns {string}
 */
Discord.User.prototype.getHandle = function() {
	return this.username + '#' + this.discriminator;
};

/**
 * Returns whether or not the user is a member of the water club
 * @returns {boolean}
 */
Discord.User.prototype.isWaterMember = function() {
	return !(
		Storage.users[this.id] === undefined ||
		Storage.users[this.id].water === undefined ||
		Storage.users[this.id].water.enabled !== true
	);
};

/**
 * Returns the database entry of the user
 * @returns {Object}
 */
Discord.User.prototype.getDbEntry = function() {
	if (!Storage.users.hasOwnProperty(this.id)) throw 'User ' + this.getHandle() + 'doesn\'t have an entry.';
	return Storage.users[this.id];
};

Discord.User.prototype.getPermissionLevel = function(msg) {
	let dbEntry = this.getDbEntry();
	let permissionLevel = dbEntry.permissionLevel ? dbEntry.permissionLevel : 0;
	if (permissionLevel === permissionLevels.NONE) {
		if (msg.channel.type === 'text') {
			let server = msg.channel.guild;
			let serverDbEntry = server.getDbEntry();
			let serverOwnerRole = msg.channel.guild.roles.get(serverDbEntry.roles.owner);
			let serverSuperUserRole = msg.channel.guild.roles.get(serverDbEntry.roles.superuser);
			if (msg.member.roles.has(serverOwnerRole.id)) return permissionLevels.SERVER_OWNER;
			if (msg.member.roles.has(serverSuperUserRole.id)) return permissionLevels.SERVER_SUPERUSER;
		}
	}
	return permissionLevel;
};

/**
 * Returns the direct link to a message
 * @returns {String}
 */
Discord.Message.prototype.getLink = function () {
	return 'http://discordapp.com/channels/' + ((this.channel.type === 'text') ? this.guild.id : '@me') + '/' + this.channel.id + '/' + this.id;
};

/**
 * Returns a simplified version of a collection that starts at 0 and iterates by adding 1 to each entry
 * @returns {Discord.Collection<int, *>}
 */
Discord.Collection.prototype.simplify = function () {
	let simple = new Discord.Collection();
	let counter = 0;
	this.forEach(value => {
		simple.set(counter, value);
		counter++;
	});
	return simple;
};

// CONSTANTS
const CONFIG_PATH 	= './config.json';
const DATA_PATH 	= './storage/data.json';
const BLOCKED_PATH 	= './storage/blocked_users.json';
const DELETED_PATH 	= './storage/deleted_messages.json';
const EDITED_PATH 	= './storage/edited_messages.json';
const REMINDER_PATH	= './storage/reminders.json';

const REMINDER_SIGNUP_EMOJI = '🙋';

// DATA VARS
let Config = {};
let Storage = {};
let Blocked = [];
let Deleted = [];
let Edited = [];
let Reminders = [];

// LOAD FILES
Config =	loadFile(CONFIG_PATH, Config);
Storage =	loadFile(DATA_PATH, Storage);
Blocked =	loadFile(BLOCKED_PATH, Blocked);
Deleted =	loadFile(DELETED_PATH, Deleted);
Edited =	loadFile(EDITED_PATH, Edited);
Reminders =	loadFile(REMINDER_PATH, Reminders);

// SET DEFAULT VALUES
Config.prefix = Config.prefix || '!';
Config.token = Config.token || null;
Config.debug = Config.debug !== undefined ? Config.debug : false;
Config.ownerId = Config.ownerId || null;
Config.badWordFilter = Config.badWordFilter || false;

Storage.servers = Storage.servers || {};
Storage.users = Storage.users || {};

// SAVE FILES WITH POTENTIALLY UPDATED DATA
saveFile(CONFIG_PATH, Config);
saveFile(DATA_PATH, Storage);
saveFile(BLOCKED_PATH, Blocked);
saveFile(DELETED_PATH, Deleted);
saveFile(EDITED_PATH, Edited);
saveFile(REMINDER_PATH, Reminders);

// CHECK REQUIRED VALUES AND EXIT IF NECESSARY
let canRunBot = true;

if (Config.token === null) {
	warn('Property \'token\' missing in config.json!');
	canRunBot = false;
}
if (Config.ownerId === null) {
	warn(
		'Property \'ownerId\' missing in config.json! Please fill in the ID of your discord user.' + '\n' +
		'Without an ownerId it is not possible to perform actions that require a bot superuser.'
	);
}

if (!canRunBot) process.exit(1);

// SHARED VARS
let waterTimers			= new Discord.Collection();
let runningWaterTimers	= new Discord.Collection();

let reminders			= new Discord.Collection();
let runningReminders	= new Discord.Collection();

let reactionListeners	= new Discord.Collection();

// ENUM
const colors = require('./enum/EmbedColorEnum.js');
const months = require('./enum/MonthEnum.js');
const daysOfWeek = require('./enum/WeekDayEnum.js');
const argumentValues = require('./enum/ArgumentValueEnum.js');
const reactionEvents = require('./enum/ReactionEventEnum.js');
const gameTypes = require('./enum/GameTypeEnum.js');
const permissionLevels = require('./enum/PermissionLevelEnum.js');

//// EXPORTS
module.exports = {
	Discord, fs, chrono,
	client,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveConfig, saveData, saveBlocked, saveDeleted, saveEdited, saveReminders, saveWaterTimers,
	debug, log, info, warn,
	updatePresence, findChannelOfMsgId, parseDate,
	sendWednesday,
	combineCommandChain, getCommandHelp, getFullHelpEmbed,
	waterTimers, runningWaterTimers,
	loadWaterTimers, addWaterTimer, startAllWaterTimers,
	reminders, runningReminders, getRemindersOfUser,
	loadReminders, addReminder, startAllReminders, filterReminders, leaveAllReminders,
	getBooleanValue, getUsers, testBooleanValue,
	reactionListeners, addReactionListener, REMINDER_SIGNUP_EMOJI
};

//// METHODS
// CONSOLE
/**
 * Sends a message with the prefix [DEBUG] to the console in dark aqua if the 'debug' setting is active in config
 * @param {*} msg
 */
function debug(msg) {
	if (Config.debug) {
		if (msg instanceof Object) {
			console.log('\x1b[36m%s\x1b[0m', '[DEBUG]');
			console.log(msg);
		} else {
			console.log('\x1b[36m%s\x1b[0m', `[DEBUG] ${msg}`);
		}
	}
}

/**
 * Sends a message with the prefix [LOG] to the console
 * @param {*} msg
 */
function log(msg) {
	if (msg instanceof Object) {
		console.log('\x1b[2m%s\x1b[0m', '[LOG]');
		console.log(msg);
	} else {
		console.log('\x1b[2m%s\x1b[0m', `[LOG] ${msg}`);
	}
}

/**
 * Sends a message with the prefix [INFO] to the console in yellow
 * @param {*} msg
 */
function info(msg) { console.log('\x1b[33m%s\x1b[0m', `[INFO] ${msg}`); }

/**
 * Sends a message with the prefix [WARN] to the console in red
 * @param {*} msg
 */
function warn(msg) { console.log('\x1b[31m%s\x1b[0m', `[WARN] ${msg}`); }

// FILESYSTEM
/**
 * Loads a file and creates it in case it does not exist
 * @param {String} filePath
 * @param {Object} variable
 * @returns {*}
 */
function loadFile(filePath, variable) {
	let temp;
	try {
		temp = require(filePath);
		debug('Read ' + filePath);
	} catch (e) {
		saveFile(filePath, variable);
		info('Created ' + filePath);
		if (filePath === CONFIG_PATH) {
			info('Please configure the bot with your credentials inside ' + CONFIG_PATH + '.');
			process.exit(1);
		}
	}
	return temp || variable;
}

/**
 * Saves a file using a variable
 * @param {String} filePath
 * @param {Object} variable
 */
function saveFile(filePath, variable) {
	fs.writeFileSync(filePath, JSON.stringify(variable, null, 2));
}

// SPECIAL R/W

const Reminder = require('./class/Reminder.js');
const WaterTimer = require('./class/WaterTimer.js');

/**
 * Adds a reminder to the list
 * @param reminder
 */
function addReminder(reminder) {
	reminders.set(reminder.id, reminder);
	saveReminders();
}

/**
 * Loads all reminders into cache
 */
async function loadReminders() {
	let collection = await readReminders();
	collection.forEach(reminder => {
		addReminder(reminder);
	});
	debug('Loaded all reminders.');
}

/**
 * Gets a collection of all reminders including its real message values
 * @returns {Promise<Discord.Collection<*,*>>}
 */
async function readReminders() {
	debug('Reading all saved reminders...');
	let collection = new Discord.Collection();
	for (let reminderEntry of Reminders) {
		let jsonReminder = reminderEntry[1];

		let userMsgId = jsonReminder.userMsg.id;
		let userMsgChannelId = jsonReminder.userMsg.channel.id;
		let userMsg = await getMessageInChannelId(userMsgId, userMsgChannelId);

		let botMsg;

		if (jsonReminder.botMsg == null) {
			botMsg = null;
		} else {
			let botMsgId = jsonReminder.botMsg.id;
			let botMsgChannelId = jsonReminder.botMsg.channel.id;
			botMsg = await getMessageInChannelId(botMsgId, botMsgChannelId);
		}

		let date = new Date(jsonReminder.date);
		let task = jsonReminder.task;
		let id = reminderEntry[0];

		let users = [];

		if (jsonReminder.users) {
			for (let userEntry of jsonReminder.users) {
				let user = client.users.get(userEntry);
				users.push(user);
			}
		}

		let reminder = new Reminder(
			userMsg, date, task, botMsg, id, users
		);
		collection.set(id, reminder);
	}
	debug('Done!');
	return collection;
}

/**
 * Formats the list of cached reminders into a save-able form
 */
function formatReminders() {
	let shortReminders = new Discord.Collection();
	reminders.forEach((reminder, id) => {

		let botMsg = reminder.botMsg == null ? null : {
			id : reminder.botMsg.id,
			channel : {
				id : reminder.botMsg.channel.id,
				type : reminder.botMsg.channel.type
			}
		};

		let shortUsers = reminder.users.map(val => val.id);

		let shortReminder = {
			id : id,
			users : shortUsers,
			userMsg : {
				id : reminder.userMsg.id,
				channel : {
					id : reminder.userMsg.channel.id,
					type : reminder.userMsg.channel.type
				}
			},
			botMsg : botMsg,
			date : reminder.date,
			task : reminder.task
		};
		shortReminders.set(id, shortReminder);
	});
	return shortReminders;
}

/**
 * Adds a water timer to the list of cached water timers
 * @param waterTimer
 */
function addWaterTimer(waterTimer) {
	waterTimers.set(waterTimer.user.id, waterTimer);
	saveWaterTimers();
}

/**
 * Loads all water timers to the list of cached water timers
 */
function loadWaterTimers() {
	for (let userId in Storage.users) {
		if (!Storage.users.hasOwnProperty(userId)) continue;
		let userEntry = Storage.users[userId];
		if (!userEntry.hasOwnProperty('water')) continue;
		if (userEntry.water.enabled === true) {
			let user = client.users.get(userId);
			let lastDate = userEntry.water.lastDate ? new Date(userEntry.water.lastDate) : undefined;
			let nextDate = userEntry.water.nextDate ? new Date(userEntry.water.nextDate) : undefined;
			let missed = userEntry.water.missed || 0;
			let waterTimer = new WaterTimer(user, userEntry.water.interval, lastDate, nextDate, missed);
			addWaterTimer(waterTimer);
		}
	}
	debug('Loaded all water timers.');
}

/**
 * Saves all cached water timers into the database
 */
function saveWaterTimers() {
	waterTimers.forEach(waterTimer => {
		let user = waterTimer.user;
		let userWater = Storage.users[user.id].water;
		userWater.interval = waterTimer.interval;
		userWater.lastDate = waterTimer.lastDate;
		userWater.nextDate = waterTimer.nextDate;
		userWater.missed = waterTimer.missed;
	});
	saveData();
}

/**
 * Starts the water timers of all users
 */
function startAllWaterTimers() {
	waterTimers.forEach(waterTimer => {
		if (waterTimer.user.isWaterMember) {
			waterTimer.start();
		}
	});
	debug('Started all water timers.');
}

// SPECIFIC SAVES
function saveConfig()		{saveFile(CONFIG_PATH,	Config);	}
function saveData() 		{saveFile(DATA_PATH, 	Storage);	}
function saveBlocked()		{saveFile(BLOCKED_PATH, Blocked);	}
function saveDeleted() 		{saveFile(DELETED_PATH, Deleted);	}
function saveEdited() 		{saveFile(EDITED_PATH, 	Edited);	}
function saveReminders()	{saveFile(REMINDER_PATH, Array.from(formatReminders()));}

// HELPERS

/**
 * Returns the user instance of the owner of the bot, as specified inside `config.json`
 * @returns {User}
 */
function getOwner() {
	return client.users.get(Config.ownerId);
}

/**
 * Returns a number with its ordinal (1st, 2nd, 3rd, 4th, ...)
 * @param {Number} n
 * @returns {String}
 */
function getNumberWithOrdinal(n) {
	let s = ["th","st","nd","rd"],
		v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Updates the status and presence of the bot
 * @param {String} status
 * @param {String} name
 * @param {Number} type
 * @param {String} url
 */
function updatePresence(status = 'online', name = Config.prefix + 'help', type = gameTypes.LISTENING, url = 'https://www.github.com/Kaeks/wiktor-bot') {
	client.user.setPresence({
		status: status,
		game : {
			name : name,
			type : type,
			url: url
		}
	}).catch(console.error);
}

/**
 * Turns a date into a string with regard for how long the difference between now and the date is
 * @param {Date} date
 * @returns {String}
 */
function parseDate(date) {
	let now = new Date();
	let diff = date - now;

	let year = date.getFullYear(),
		month = date.getMonth(),
		day = date.getDate(),
		dayOfWeek = date.getDay(),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		//seconds = date.getSeconds(),
		monthString = months[month].short,
		dowString = daysOfWeek[dayOfWeek].name;

	// Less than a day
	if (diff <= 24 * 60 * 60 * 1000) {
		let diffHours = Math.floor(diff / (1000 * 60 * 60));
		let diffMinutes = Math.floor(diff / (1000 * 60) - 60 * diffHours);
		// Less than an hour
		if (diff <= 60 * 60 * 1000) {
			let diffSecs = Math.floor(diff / 1000 - 60 * diffMinutes);
			// Less than a minute
			if (diff <= 60 * 1000) return `In ${diffSecs} second${diffSecs !== 1 ? 's' : ''}`;
			return `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ${diffSecs > 0 ? diffSecs + ' second' + (diffSecs !== 1 ? 's' : '') : ''}`
		}
		return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes > 0 ? diffMinutes + ' minute' + (diffMinutes !== 1 ? 's' : '') : ''}`
	}

	// Not this year
	if (now.getFullYear() !== date.getFullYear()) {
		return `${dowString}, ${monthString}. ${getNumberWithOrdinal(day)} ${year} ${hours.pad(2)}:${minutes.pad(2)}`;
	}

	// Today
	if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth()) {
		return `${hours.pad(2)}:${minutes.pad(2)}`;
	}

	// This year but not today
	return `${dowString}, ${monthString}. ${getNumberWithOrdinal(day)} ${hours.pad(2)}:${minutes.pad(2)}`;
}

async function getMessageInChannelId(msgId, channelId) {
	return await getMessageInChannel(msgId, client.channels.get(channelId));
}

async function getMessageInChannel(msgId, channel) {
	try {
		return await channel.fetchMessage(msgId);
	} catch (e) {
		info('Tried to find message with id ' + msgId + ' inside channel with id ' + channel.id + ' but couldn\'t find anything.');
	}
}

/**
 * Returns a string of the combined commands and sub-commands inside a commandChain, separated by ' '
 * @param {Array} commandChain
 * @returns {String}
 */
function combineCommandChain(commandChain) {
	let commandString = '';
	for (let i = 0; i < commandChain.length; i++) {
		commandString += commandChain[i].name;
		if (i < commandChain.length - 1) commandString += ' ';
	}
	return commandString;
}

/**
 * Helper method for getting command help.
 * @param {String} commandString
 * @param {String} usage
 * @param {String} description
 * @returns {string}
 */
function getHelpRow(commandString, usage, description = undefined) {
	let base = '`' + Config.prefix + commandString + ' ' + usage + '`' + '\n';
	return description === undefined ? base : base + '> ' + description + '\n';
}

/**
 * Returns a list of possible uses of a command as a string
 * @param {Object} command
 * @param {Array} commandChain
 * @returns {String}
 */
function getCommandHelp(command, commandChain = []) {
	let localCommandChain = commandChain.slice();
	localCommandChain.push(command);
	let commandString = combineCommandChain(localCommandChain);
	let helpText = '';
	if (command.hasOwnProperty('usage')) {
		if (command.hasOwnProperty('description')) {
			if (typeof command.usage === 'string' && typeof command.description === 'string') {
				helpText += getHelpRow(commandString, command.usage, command.description);
			} else if (command.usage instanceof Array && command.description instanceof Array) {
				if (command.usage.length === command.description.length) {
					for (let i = 0; i < command.usage.length; i++) {
						helpText += getHelpRow(commandString, command.usage[i], command.description[i]);
					}
				} else warn(`Lengths of usage and description properties of command '${commandString}' do not match.`);
			} else warn(`Types of usage and description properties of command '${commandString}' do not match.`);
		} else {
			if (typeof command.usage === 'string') {
				helpText += getHelpRow(commandString, command.usage);
			} else if (command.usage instanceof Array) {
				for (let i = 0; i < command.usage.length; i++) {
					helpText += getHelpRow(commandString, command.usage[i]);
				}
			}
			info(`Command '${commandString}' has usage property, but no description property.`)
		}
	} else if ([argumentValues.OPTIONAL, argumentValues.REQUIRED].includes(command.args)) info(`Command '${commandString}' doesn't have a usage property.`);

	if (command.hasOwnProperty('sub')) {
		let subs = command.sub;
		for (let sub in subs) {
			if (!subs.hasOwnProperty(sub)) continue;
			helpText += getCommandHelp(subs[sub], localCommandChain);
		}
	}
	return helpText;
}

/**
 * Returns an embed with *all* commands to the author of the message
 * @param msg
 * @param embed
 */
function getFullHelpEmbed(msg, embed) {
	const { commands } = msg.client;
	commands.forEach(function (value, key) {
		embed.addField(key, getCommandHelp(value));
	});
}

// WEDNESDAY
/**
 * Sends an image of the wednesday frog to the specified channel
 * @param channel
 */
function sendWednesday(channel) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(colors.GREEN)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	channel.send({ embed: embed });
}

// REMINDERS
/**
 * Runs a function on a specific date
 * @param {Date} date
 * @param {Function} func
 */
function runAtDate(date, func) {
	let now = new Date();
	let diff = date - now;
	if (diff > 0x7FFFFFFF) { // setTimeout limit
		return setTimeout(function() {
			return runAtDate(date, func);
		}, 0x7FFFFFFF);
	} else {
		return setTimeout(func, diff);
	}
}

/**
 * Sends notifications for the expired reminders inside the collection
 * @param collection
 * @returns {Promise<void>}
 */
async function notifyOldReminders(collection) {
	let usersWithOldReminders = getUsersWithReminders(collection);
	for (const userEntry of usersWithOldReminders) {
		let user = userEntry[1];
		let oldReminders = getRemindersOfUser(user, collection);
		let tempText = 'I wasn\'t able to remind you of these messages:\n';
		for (const reminderEntry of oldReminders) {
			let reminder = reminderEntry[1];
			let realDate = new Date(reminder.date);
			tempText += '[' + parseDate(realDate);
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
function filterReminders() {
	let now = new Date();
	let amt = 0;
	let filtered = reminders.filter(reminder => {
		let bool = (new Date(reminder.date) <= now);
		if (bool) amt++;
		return bool;
	});
	reminders = reminders.filter(reminder => {
		return (new Date(reminder.date) > now);
	});
	debug(`Removed ${amt} outdated reminders.`);
	notifyOldReminders(filtered).catch(console.error);
	saveReminders();
}

/**
 * Returns a collection of users that are signed up for the reminders in the reminder collection
 * @param collection
 * @returns {Collection<Snowflake, User>}
 */
function getUsersWithReminders(collection = reminders) {
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
 * Returns a collection of reminders in which the user appears inside the optionally provided collection of reminders
 * @param user
 * @param collection
 * @returns {Collection<Snowflake, Object>}
 */
function getRemindersOfUser(user, collection = reminders) {
	return collection.filter(value => {
		return value.users.includes(user);
	});
}

async function findChannelOfMsgId(id) {
	let textChannels = client.channels.filter(channel => { return channel.type === 'text'; });
	let groupChannels = client.channels.filter(channel => { return channel.type === 'group'; });
	let users = getUsers();
	let dmChannels = new Discord.Collection();
	for (const userEntry of users) {
		let user = userEntry[1];
		let dmChannel = await user.getDmChannel();
		dmChannels.set(dmChannel.id, dmChannel);
	}
	let channels = textChannels.concat(dmChannels, groupChannels);
	for (const channelEntry of channels) {
		let channel = channelEntry[1];
		try {
			let message = await channel.fetchMessage(id);
			return message.channel;
		} catch (e) {
			debug('This ain\'t it, chief.');
		}
	}
}

/**
 * Starts all reminders
 */
function startAllReminders() {
	reminders.forEach(reminder => {
		reminder.start();
	});
	debug('Started all reminder timers.');
}

/**
 * Removes a user from the list of users of all reminders
 * @param user
 */
function leaveAllReminders(user) {
	let userReminders = getRemindersOfUser(user);
	userReminders.forEach(reminder => {
		reminder.removeUser(user);
	});
	saveReminders();
}

/**
 * Returns the boolean value of a <true|false> String
 * @param {String} suffix
 * @returns {boolean}
 */
function getBooleanValue(suffix) {
	let newVal;
	if (suffix === 'true') {
		newVal = true;
	} else if (suffix === 'false') {
		newVal = false;
	}
	return newVal
}

/**
 * Tests the value of a should-be boolean input. Sends an error message to the message's channel if the value is not a boolean
 * @param msg
 * @param {boolean} value
 * @returns {boolean}
 */
function testBooleanValue(msg, value) {
	if (value === undefined) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Invalid value!')
			.setDescription('Can only be set to `true` or `false`.');
		msg.channel.send({ embed: embed })
			.then(message => message.delete(5000));
		return false;
	}
	return true;
}

/**
 * Gets a collection of real users (i.e. without bot users)
 * @returns {Collection}
 */
function getUsers() {
	return client.users.filter(user => {
		return user.bot === false
	});
}

/**
 * @name ReactionAction
 * @function
 * @param messageReaction
 * @param user
 * @param event
 */

/**
 * Add a reaction listener to a message with a function that triggers when a reaction from the list of reactions is added or removed
 * @param msg
 * @param {ReactionAction} fn
 * @param reactions
 */
function addReactionListener(msg, fn, reactions = []) {
	let id = Discord.SnowflakeUtil.generate();
	let temp = {
		id : id,
		msgId : msg.id,
		reactions : reactions,
		fn : fn
	};
	reactionListeners.set(id, temp);
	return id;
}

/**
 * Removes a reaction listener from the list of reaction listeners
 * @param id
 * @returns {boolean}
 */
function removeReactionListener(id) {
	if (!reactionListeners.has(id)) return false;
	reactionListeners.delete(id);
	return true;
}
