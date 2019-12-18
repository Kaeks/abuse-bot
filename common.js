const fs = require('fs');
const { Discord, chrono, client } = require('./bot');

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
 * Enables a feature
 * @param feature
 */
Discord.Guild.prototype.enableFeature = function(feature) {
	if (!serverFeatures.includes(feature)) {
		throw 'Feature ' + feature + ' does not exist.';
	}
	let serverEntry = this.getDbEntry();
	if (!serverEntry.disabledFeatures.includes(feature)) {
		serverEntry.disabledFeatures.push(feature);
	}
	saveData();
};

/**
 * Disables a feature
 * @param feature
 */
Discord.Guild.prototype.disableFeature = function(feature) {
	if (!serverFeatures.includes(feature)) {
		throw 'Feature ' + feature + ' does not exist.';
	}
	let serverEntry = this.getDbEntry();
	serverEntry.disabledFeatures = serverEntry.disabledFeatures.filter(value => {
		return value !== feature;
	});
	saveData();
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

/**
 * Returns the permission level of the user where msg is located
 * @param msg
 * @returns {number}
 */
Discord.User.prototype.getPermissionLevel = function(msg) {
	let dbEntry = this.getDbEntry();
	if (this === getOwner()) return permissionLevels.BOT_OWNER;
	if (dbEntry.permissionLevel) return dbEntry.permissionLevel;
	if (msg.channel.type === 'text') {
		let server = msg.channel.guild;
		let serverDbEntry = server.getDbEntry();
		let serverOwnerRole = msg.channel.guild.roles.get(serverDbEntry.roles.owner);
		let serverSuperUserRole = msg.channel.guild.roles.get(serverDbEntry.roles.superuser);
		if (msg.member.roles.has(serverOwnerRole.id)) return permissionLevels.SERVER_OWNER;
		if (msg.member.roles.has(serverSuperUserRole.id)) return permissionLevels.SERVER_SUPERUSER;
	}
	return permissionLevels.NONE;
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

/**
 * Returns a page of this collection limited by an amount
 * @param {Number} limit
 * @param {Number} page
 * @returns {Discord.Collection<*, *>}
 */
Discord.Collection.prototype.getSubList = function (limit, page = 0) {

	if (this.size < page * limit + 1) {
		throw 'Collection size (' + this.size + ') with limit (' + limit + ') is too small for the given page count (' + page + ').';
	}

	let subList = new Discord.Collection();
	for (let i = page * limit; i < limit * (page + 1); i++) {
		let cur = this.array()[i];
		if (cur === undefined) break;
		subList.set(i, cur);
	}
	return subList;
};

//// CONSTANTS

// CONFIG LOADING

const CONFIG_PATH = './config.json';
let Config = {};
Config = loadFile(CONFIG_PATH, Config);

// CONFIG DEFAULT VALUES
Config.prefix			= Config.prefix || '!';
Config.token			= Config.token || null;
Config.debug			= Config.debug || false;
Config.ownerId			= Config.ownerId || null;
Config.badWordFilter	= Config.badWordFilter || false;
Config.devMode			= Config.devMode || false;
Config.devToken			= Config.devToken || null;

saveFile(CONFIG_PATH, Config);

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
if (Config.devMode === true && Config.devToken === null) {
	warn('Property \'devMode\' is enabled, but a \'devToken\' is missing in config.json!' + '\n' + 'Add a \'devToken\' or disable \'devMode\'.');
	canRunBot = false;
}

if (!canRunBot) process.exit(1);

const STORAGE_PATH = Config.devMode ? './storage/dev/' : './storage/';

// STORAGE FILE PATHS
const DATA_PATH			= STORAGE_PATH + 'data.json';
const BLOCKED_PATH		= STORAGE_PATH + 'blocked_users.json';
const DELETED_PATH		= STORAGE_PATH + 'deleted_messages.json';
const EDITED_PATH		= STORAGE_PATH + 'edited_messages.json';
const REMINDER_PATH		= STORAGE_PATH + 'reminders.json';
const CUSTOM_FUNC_PATH	= STORAGE_PATH + 'custom_functions.json';

const REMINDER_SIGNUP_EMOJI = '🙋';
const PREF_CONFIRMATION_EMOJI_BASE = '👌';

// DATA VARS
let Storage = {};
let Blocked = [];
let Deleted = [];
let Edited = [];
let Reminders = [];
let CustomFunctions = [];

// LOAD FILES
Storage			= loadFile(DATA_PATH, Storage);
Blocked			= loadFile(BLOCKED_PATH, Blocked);
Deleted			= loadFile(DELETED_PATH, Deleted);
Edited			= loadFile(EDITED_PATH, Edited);
Reminders		= loadFile(REMINDER_PATH, Reminders);
CustomFunctions	= loadFile(CUSTOM_FUNC_PATH, CustomFunctions);

// SET DEFAULT VALUES
Storage.servers	= Storage.servers || {};
Storage.users	= Storage.users || {};

// SAVE FILES WITH POTENTIALLY UPDATED DATA
saveFile(DATA_PATH, Storage);
saveFile(BLOCKED_PATH, Blocked);
saveFile(DELETED_PATH, Deleted);
saveFile(EDITED_PATH, Edited);
saveFile(REMINDER_PATH, Reminders);
saveFile(CUSTOM_FUNC_PATH, CustomFunctions);

// SHARED VARS
let waterTimers			= new Discord.Collection();
let runningWaterTimers	= new Discord.Collection();

let reminders			= new Discord.Collection();
let runningReminders	= new Discord.Collection();

let reactionListeners	= new Discord.Collection();

let customFunctions		= new Discord.Collection();

// ENUM
const colors = require('./enum/EmbedColorEnum');
const months = require('./enum/MonthEnum');
const daysOfWeek = require('./enum/WeekDayEnum');
const gameTypes = require('./enum/GameTypeEnum');
const permissionLevels = require('./enum/PermissionLevelEnum');
const serverFeatures = require('./enum/ServerFeatureEnum');
const timeSpans = require('./enum/TimeSpanEnum');

//// EXPORTS
module.exports = {
	Discord, fs, chrono,
	client, getOwner,
	Config, Storage, Blocked, Deleted, Edited,
	saveFile,
	saveConfig, saveData, saveBlocked, saveDeleted, saveEdited, saveReminders, saveWaterTimers, saveCustomFunctions,
	debug, log, info, warn,
	updatePresence, parseDate,
	sendWednesday,
	combineCommandChain, getCommandHelp, getFullHelpEmbed,
	waterTimers, runningWaterTimers,
	loadWaterTimers, addWaterTimer, startAllWaterTimers,
	reminders, runningReminders, getRemindersOfUser,
	loadReminders, addReminder, startAllReminders, filterReminders, leaveAllReminders,
	getBooleanValue, getUsers, testBooleanValue,
	reactionListeners, addReactionListener, REMINDER_SIGNUP_EMOJI, PREF_CONFIRMATION_EMOJI_BASE,
	customFunctions, loadCustomFunctions, addCustomFunction, deleteAllCustomFunctions
};

// CLASS IMPORTS
const Command = require('./class/Command');

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

const Reminder = require('./class/Reminder');
const WaterTimer = require('./class/WaterTimer');
const CustomFunction = require('./class/CustomFunction');

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
 * Helper method to get a message from a reminder message entry
 * @param {Object} msgEntry
 * @returns {Promise<*>}
 */
async function getReminderMsg(msgEntry) {
	let msgId = msgEntry.id;
	let msgChannelEntry = msgEntry.channel;
	if (msgChannelEntry.type === 'dm') {
		if (!msgChannelEntry.hasOwnProperty('recipient')) {
			msgChannelEntry.recipient = {};
			let recipient = await findRecipientOfDmChannelId(msgChannelEntry.id);
			msgChannelEntry.recipient.id = recipient.id;
		}
	}
	return await getMessageInChannelEntry(msgId, msgChannelEntry);
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

		// Convert old entries to use larger, but easier to use shorthand message format instead of just the ID
		if (typeof jsonReminder.userMsg == 'string') {
			jsonReminder.userMsg = await getFixedMessage(jsonReminder.userMsg);
		}
		let userMsg = await getReminderMsg(jsonReminder.userMsg);

		let botMsg;
		if (jsonReminder.botMsg == null) {
			botMsg = null;
		} else {
			// Convert old entries to use larger, but easier to use shorthand message format instead of just the ID
			if (typeof jsonReminder.botMsg == 'string') {
				jsonReminder.botMsg = await getFixedMessage(jsonReminder.botMsg);
			}
			botMsg = await getReminderMsg(jsonReminder.botMsg);
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

function formatMsg(msg) {
	let msgEntry = {
		id: msg.id,
		channel: {
			id: msg.channel.id,
			type: msg.channel.type
		}
	};
	if (msg.channel.type === 'dm') {
		msgEntry.channel.recipient = {
			id: msg.channel.recipient.id
		}
	}
	return msgEntry;
}

function formatReminder(reminder) {
	return {
		id : reminder.id,
		users : reminder.users.map(val => val.id),
		userMsg : formatMsg(reminder.userMsg),
		botMsg : reminder.botMsg != null ? formatMsg(reminder.botMsg) : null,
		date : reminder.date,
		task : reminder.task
	};
}

/**
 * Formats the list of cached reminders into a save-able form
 */
function formatReminders() {
	let shortReminders = new Discord.Collection();
	reminders.forEach((reminder, id) => {
		shortReminders.set(id, formatReminder(reminder));
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

function readCustomFunctions() {
	debug('Reading custom functions...');
	let collection = new Discord.Collection();
	for (let customFunctionEntry of CustomFunctions) {
		let jsonCustomFunction = customFunctionEntry[1];

		let name = jsonCustomFunction.name;
		let fn = jsonCustomFunction.fn;
		let creator = client.users.get(jsonCustomFunction.creator);
		let date = new Date(jsonCustomFunction.date);
		let executions = jsonCustomFunction.executions;

		let customFunction = new CustomFunction(name, fn, creator, date, executions);
		collection.set(name, customFunction);
	}
	debug('Done!');
	return collection;
}

function loadCustomFunctions() {
	let collection = readCustomFunctions();
	collection.forEach(customFunction => addCustomFunction(customFunction));
	debug('Loaded all custom functions.');
}

function formatCustomFunctions() {
	let shortCustomFunctions = new Discord.Collection();
	customFunctions.forEach(customFunction => {
		shortCustomFunctions.set(customFunction.name, {
			name: customFunction.name,
			fn: customFunction.fn,
			creator: customFunction.creator.id,
			date: customFunction.date,
			executions: customFunction.executions
		})
	});
	return shortCustomFunctions;
}

function addCustomFunction(customFunction) {
	customFunctions.set(customFunction.name, customFunction);
	saveCustomFunctions();
}

function removeCustomFunction(name) {
	customFunctions.delete(name);
	saveCustomFunctions();
}



// SPECIFIC SAVES
function saveConfig()		{saveFile(CONFIG_PATH,	Config);	}
function saveData() 		{saveFile(DATA_PATH, 	Storage);	}
function saveBlocked()		{saveFile(BLOCKED_PATH, Blocked);	}
function saveDeleted() 		{saveFile(DELETED_PATH, Deleted);	}
function saveEdited() 		{saveFile(EDITED_PATH, 	Edited);	}
function saveReminders()	{saveFile(REMINDER_PATH, Array.from(formatReminders()));}
function saveCustomFunctions()	{saveFile(CUSTOM_FUNC_PATH, Array.from(formatCustomFunctions()));}

// HELPERS

/**
 * Gets the fixed shorthand message entry for a messageId
 * This is used to convert an entry that is just a messageId into a usable entry
 * @param msgId
 * @returns {Promise<{channel: {id: *, type: *}, id: *}>}
 */
async function getFixedMessage(msgId) {
	let message = await findMessageWithId(msgId);

	let fixedMessage = {
		id : message.id,
		channel : {
			id : message.channel.id,
			type : message.channel.type
		}
	};
	if (message.channel.type === 'dm') {
		fixedMessage.channel.recipient = {
			id : message.channel.recipient.id
		};
	}
	debug('Got fixed message entry for message with id \'' + msgId + '\'.');
	return fixedMessage
}

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
	let absDiff = Math.abs(diff);

	let year = date.getFullYear(),
		month = date.getMonth(),
		day = date.getDate(),
		dayOfWeek = date.getDay(),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		monthString = months[month].short,
		dowString = daysOfWeek[dayOfWeek].name;

	// Less than a day
	if (absDiff <= timeSpans.DAY) {
		let diffHours = Math.floor(absDiff / timeSpans.HOUR);
		let diffHoursString = diffHours + ' hour' + (diffHours !== 1 ? 's' : '');
		let diffMinutes = Math.floor(absDiff / timeSpans.MINUTE - 60 * diffHours);
		let diffMinutesString = diffMinutes + ' minute' + (diffMinutes !== 1 ? 's' : '');
		let diffSecs = Math.floor(absDiff / timeSpans.SECOND - 60 * diffMinutes);
		let diffSecsString = diffSecs + ' second' + (diffSecs !== 1 ? 's' : '');
		return (diff > 0 ? 'In ' : '')
			+ (absDiff > timeSpans.HOUR ? diffHoursString + ' ' : '')
			+ (absDiff > timeSpans.MINUTE ? diffMinutesString + ' ' : '')
			+ (absDiff <= timeSpans.MINUTE ? diffSecsString : '')
			+ (diff < 0 ? ' ago' : '');
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

/**
 * Finds the recipient of a DM channel
 * @param dmChannelId
 * @returns {Promise<*>}
 */
async function findRecipientOfDmChannelId(dmChannelId) {
	let dmChannels = new Discord.Collection();

	let users = getUsers();

	for (const userEntry of users) {
		let user = userEntry[1];
		let dmChannel = await user.getDmChannel();
		dmChannels.set(dmChannel.id, dmChannel);
	}

	if (!dmChannels.has(dmChannelId)) {
		throw 'DM channel with id \'' + dmChannelId + '\' could not be found.';
	}

	return dmChannels.get(dmChannelId).recipient;
}

/**
 * Gets a message in a channel entry, with
 * @param msgId
 * @param {Object} channelEntry
 * @returns {Promise<*>}
 */
async function getMessageInChannelEntry(msgId, channelEntry) {
	let channel;
	if (!client.channels.has(channelEntry.id)) {
		if (channelEntry.type !== 'dm') {
			throw 'I don\'t have the channel with id \'' + channelEntry.id + '\' cached.';
		}
		if (!channelEntry.hasOwnProperty('recipient')) {
			throw 'The channel with id \'' + channelEntry.id + '\' is a DM channel but has no recipient.';
		}
		let recipientId = channelEntry.recipient.id;
		let user = client.users.get(recipientId);
		channel = await user.getDmChannel();
	} else {
		channel = client.channels.get(channelEntry.id);
	}
	return await getMessageInChannel(msgId, channel);
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
 * @param {Command} command
 * @param {String} usage
 * @param {String} description
 * @returns {string}
 */
function getHelpRow(command, usage, description = '') {
	let base = '`' + Config.prefix + combineCommandChain(command.getCommandChain()) + ' ' + usage + '`' + '\n';
	return description === '' ? base : base + '> ' + description + '\n';
}

/**
 * Returns a list of possible uses of a command as a string
 * @param command
 * @returns {string}
 */
function getCommandHelp(command) {
	let helpText = '';
	for (let docEntry of command.doc) {
		helpText+= getHelpRow(command, docEntry.usage, docEntry.description);
	}
	if (command.sub.size > 0) {
		command.sub.forEach(subCommand => {
			helpText += getCommandHelp(subCommand);
		});
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
	commands.forEach(command => {
		embed.addField(command.name, getCommandHelp(command))
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

async function findMessageWithId(msgId) {
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
			return await channel.fetchMessage(msgId);
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

/**
 * Deletes all custom functions
 */
function deleteAllCustomFunctions() {
	customFunctions.deleteAll();
	saveCustomFunctions();
	return true;
}
