const fs = require('fs');
const { Discord, client } = require('./bot.js');

// AMENDS TO DISCORD.JS LIBRARY
/**
 * Returns the DM Channel of a user. Creates one if it does not exist.
 * @returns {Promise<DMChannel|undefined>}
 */
Discord.User.prototype.getDmChannel = async function() {
	if (this.bot) return undefined;
	return this.dmChannel != null ? this.dmChannel : await this.createDM();
};

Discord.User.prototype.sendDm = async function(data) {
	let channel = await this.getDmChannel();
	return channel.send(data);
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
const CONFIG_PATH = './config.json';
const DATA_PATH = './data.json';
const BLOCKED_PATH = './blocked_users.json';
const DELETED_PATH = './deleted_messages.json';
const EDITED_PATH = './edited_messages.json';

// SHARED VARS
let waterTimers = {};
let runningWaterTimers = {};

let reminders = new Discord.Collection();
let runningReminders = new Discord.Collection();

/*runningReminders['reminderId'] = {
	timer : setTimeout(),
	users : [],
};*/

// DATA VARS
let Config = {};
let Storage = {};
let Blocked = [];
let Deleted = [];
let Edited = [];

// LOAD FILES
Config = loadFile(CONFIG_PATH, Config);
Storage = loadFile(DATA_PATH, Storage);
Blocked = loadFile(BLOCKED_PATH, Blocked);
Deleted = loadFile(DELETED_PATH, Deleted);
Edited = loadFile(EDITED_PATH, Edited);

// SET DEFAULT VALUES
Config.prefix = Config.prefix || '!';
Config.token = Config.token || '';
Config.debug = Config.debug !== undefined ? Config.debug : false;

Storage.servers = Storage.servers || {};
Storage.users = Storage.users || {};
Storage.reminders = Storage.reminders || [];

// SAVE FILES WITH POTENTIALLY UPDATED DATA
saveFile(CONFIG_PATH, Config);
saveFile(DATA_PATH, Storage);
saveFile(BLOCKED_PATH, Blocked);
saveFile(DELETED_PATH, Deleted);
saveFile(EDITED_PATH, Edited);

// ENUM
/**
 *	'args' property for commands:
 *	NULL:		command doesn't have its own execute function
 *				'' 		❌
 *				'foo'	❌
 *	NONE: 		arguments are NOT ACCEPTED
 *				'' 		✔
 *				'foo'	❌
 *	OPTIONAL: 	arguments are OPTIONAL
 *				'' 		✔
 *				'foo'	✔
 *	REQUIRED: 	arguments are REQUIRED
 *				'' 		❌
 *				'foo'	✔
 *
 *	⚠ THIS DOES NOT INCLUDE SUB-COMMANDS ⚠
 *	* A command with only sub-commands but no standalone function is NONE
 *	* A command with sub-commands and a standalone function can be OPTIONAL or REQUIRED,
 *	  depending on whether the standalone function CAN or MUST receive an argument.
 *
 * @type {{OPTIONAL: number, NULL: number, REQUIRED: number, NONE: number}}
 */
let argumentValues = {
	NULL : -1,
	NONE : 0,
	OPTIONAL : 1,
	REQUIRED : 2
};

let colors = {
	GREEN : 0x00AE86,
	RED : 0xAE0028,
	PURPLE : 0x8600AE,
	BLURPLE : 0x7289DA,
	PRESTIGE : 0xFBC100
};

//// EXPORTS
module.exports = {
	Discord,
	fs, client,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveConfig, saveData, saveBlocked, saveDeleted, saveEdited,
	argumentValues, colors,
	debug, log, info, warn,
	updatePresence,
	parseDate,
	sendWednesday,
	combineCommandChain,
	getHelpRow, getCommandHelp, getFullHelpEmbed,
	waterTimers, runningWaterTimers,
	sendWater, addWaterTimer, loadWaterTimers, startWaterTimer, startAllWaterTimers, stopWaterTimer, updateWaterTimer, getWaterTimerStatus,
	reminders, runningReminders, getReminders, getRemindersOfUser,
	addReminder, loadReminders, startReminder, startAllReminders, filterReminders, leaveAllReminders, joinReminder, leaveReminder,
	getBooleanValue, getUsers, getTimeZone, testBooleanValue
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
function info(msg) {
	console.log('\x1b[33m%s\x1b[0m', `[INFO] ${msg}`);
}

/**
 * Sends a message with the prefix [WARN] to the console in red
 * @param {*} msg
 */
function warn(msg) {
	console.log('\x1b[31m%s\x1b[0m', `[WARN] ${msg}`);
}

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

// SPECIFIC SAVES
function saveConfig()	{saveFile(CONFIG_PATH,	Config);	}
function saveData() 	{saveFile(DATA_PATH, 	Storage);	}
function saveBlocked()	{saveFile(BLOCKED_PATH, Blocked);	}
function saveDeleted() 	{saveFile(DELETED_PATH, Deleted);	}
function saveEdited() 	{saveFile(EDITED_PATH, 	Edited);	}

// HELPERS
/**
 * Enum for the game types a {Discord.Presence} can have
 * @type {{WATCHING: number, LISTENING: number, STREAMING: number, PLAYING: number}}
 */
const gameTypes = {
	PLAYING : 0,
	STREAMING : 1,
	LISTENING : 2,
	WATCHING : 3
};
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
	let dateString;
	if (Date.compare(Date.parse(date), (1).day().fromNow()) === 1) {
		if (Date.compare(Date.parse(date), (1).year().fromNow()) === 1) {
			dateString = Date.parse(date).toString('MMM dS, yyyy HH:mm');
		} else {
			dateString = Date.parse(date).toString('MMM dS HH:mm');
		}
	} else {
		dateString = Date.parse(date).toString('HH:mm');
	}
	return dateString;
}

/**
 * Gets the time zone of a user
 * @param {User} user
 * @returns {string | *}
 */
function getTimeZone(user) {
	return Storage.users[user.id].timeZone;
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
function getHelpRow(commandString, usage, description) {
	let base = '`' + Config.prefix + commandString + ' ' + usage + '`' + '\n';
	return description === undefined ? base : base + '-- ' + description + '\n';
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
 * @param {Message} msg
 * @param {RichEmbed} embed
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
 * @param {Channel} channel
 */
function sendWednesday(channel) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(colors.GREEN)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	channel.send({ embed: embed });
}

// WATER
/**
 * Sends a water reminder to a user
 * @param {User} user
 * @returns {Promise<boolean>}
 */
async function sendWater(user) {
	runningWaterTimers[user.id].started = new Date();
	if (user.presence.status === 'offline' || (user.presence.status === 'dnd' && Storage.users[user.id].water.ignoreDnD !== true)) {
		return false;
	}
	let embed = new Discord.RichEmbed()
		.setTitle('Stay hydrated!')
		.setDescription('Drink some water **now**.')
		.setThumbnail('https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192');
	let channel = await user.getDmChannel();
	channel.send({ embed: embed });
}

/**
 * Adds the water timer of a user to the list of cached water timers
 * @param {User} user
 */
function addWaterTimer(user) {
	waterTimers[user.id] = Storage.users[user.id].water.interval;
}

/**
 * Loads all water timers to the list of cached water timers
 */
function loadWaterTimers() {
	for (let userEntry in Storage.users) {
		if (!Storage.users.hasOwnProperty(userEntry)) continue;
		if (!Storage.users[userEntry].hasOwnProperty('water')) continue;
		if (Storage.users[userEntry].water.enabled === true) {
			let user = client.users.get(userEntry);
			addWaterTimer(user);
		}
	}
	debug('Loaded all water timers.');
}

/**
 * Starts the water timer of a user
 * @param {User} user
 */
function startWaterTimer(user) {
	let now = new Date();
	let timer = setInterval(function() {
		sendWater(user);
	}, waterTimers[user.id]  * 60 * 1000);

	runningWaterTimers[user.id] = {
		timer : timer,
		started : now
	};

	debug('Started water timer for ' + user.username + '#' + user.discriminator);
}

/**
 * Starts the water timers of all users
 */
function startAllWaterTimers() {
	for (let userEntry in waterTimers) {
		if (!waterTimers.hasOwnProperty(userEntry)) continue;
		let user = client.users.get(userEntry);
		startWaterTimer(user);
	}
	debug('Started all water timers.');
}

/**
 * Stops the water timer of a user
 * @param {User} user
 * @returns {boolean}
 */
function stopWaterTimer(user) {
	if (runningWaterTimers[user.id] === undefined) {
		return false;
	}
	clearInterval(runningWaterTimers[user.id].timer);
	runningWaterTimers[user.id] = undefined;
}

/**
 * Updates the cached water timer of a user
 * @param {User} user
 */
function updateWaterTimer(user) {
	stopWaterTimer(user);
	waterTimers[user.id] = Storage.users[user.id].water.interval;
	startWaterTimer(user);
}

/**
 * Gets the time (in ms) until the water timer of a user fires
 * @param {User} user
 * @returns {number}
 */
function getWaterTimerStatus(user) {
	let now = new Date();
	debug(now);
	let started = runningWaterTimers[user.id].started;
	let future = new Date(started.getTime() + waterTimers[user.id] * 60 * 1000);
	debug(future);
	let diff = future - now;
	debug(diff);
	return diff;
}

// REMINDERS
/**
 * Adds a new reminder
 * @param {Message} msg
 * @param {Date} date
 * @param {String} task
 * @param {Message} botMsg
 */
function addReminder(msg, date, task, botMsg) {
	let msgLink = msg.getLink();
	let id = Discord.SnowflakeUtil.generate();
	let reminder = {
		id : id,
		'users' : [
			msg.author.id
		],
		'userMsg' : msg.id,
		'botMsg' : botMsg.id,
		'date' : date,
		'msgLink' : msgLink,
		'task' : task
	};
	reminders.set(id, reminder);
	saveReminders();
	debug('Added reminder with id ' + id + ':');
	debug(reminder);
	startReminder(id);
}

/**
 * Loads all reminders into cache
 */
function loadReminders() {
	reminders = new Discord.Collection(Storage.reminders);
	debug('Loaded all reminders.');
}

/**
 * Sends notifications for the expired reminders inside the collection
 * @param {Collection<Discord.Snowflake, Object>}collection
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
			tempText += '[' + parseDate(reminder.date);
			if (reminder.task != null) {
				tempText += ' - ' + reminder.task;
			}
			tempText += '](<' + reminder.msgLink + '>)';
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
		return (new Date(reminder.date) <= now);
	});
	reminders = reminders.filter(reminder => {
		let bool = (new Date(reminder.date) > now);
		if (bool) amt++;
		return bool;
	});
	debug(`Removed ${amt} outdated reminders.`);
	notifyOldReminders(filtered);
	saveReminders();
}

/**
 * Getter method for other classes
 * @returns {Discord.Collection<Discord.Snowflake, Object>}
 */
function getReminders() {
	return reminders;
}

/**
 * Returns a collection of users that are signed up for the reminders in the reminder collection
 * @param {Collection<Discord.Snowflake, Object>} collection
 * @returns {Discord.Collection<Discord.Snowflake, Discord.User>}
 */
function getUsersWithReminders(collection = reminders) {
	let users = new Discord.Collection();
	collection.forEach(reminder => {
		for (let i = 0; i < reminder.users.length; i++) {
			let userEntry = reminder.users[i];
			let user = client.users.get(userEntry);
			if (!users.has(userEntry)) {
				users.set(userEntry, user);
			}
		}
	});
	return users;
}

/**
 * Returns a collection of reminders in which the user appears inside the optionally provided collection of reminders
 * @param {User} user
 * @param {Collection<Discord.Snowflake, Object>} collection
 * @returns {Discord.Collection<Discord.Snowflake, Object>}
 */
function getRemindersOfUser(user, collection = reminders) {
	return collection.filter(value => {
		return value.users.includes(user.id);
	});
}

/**
 * Sends a reminder to a user
 * @param {Snowflake} id
 * @param {User} user
 * @returns {Promise<void>}
 */
async function sendReminder(id, user) {
	let reminder = reminders.get(id);
	let msgLink = reminder.msgLink;
	let task = reminder.task;
	let userAmt = reminder.users.length - 1;
	let tempText = 'I\'m here to remind you about [this message](<' + msgLink + '>).';
	if (task != null) tempText += '\nThe task was:\n> ' + task;
	let embed = new Discord.RichEmbed()
		.setColor(colors.GREEN)
		.setTitle('Reminder!')
		.setDescription(tempText);
	if (userAmt > 0) embed.setFooter(userAmt + ' other ' + (userAmt === 1 ? 'person' : 'people') + ' also got this reminder!');
	let channel = await user.getDmChannel();
	channel.send({ embed: embed });
}

/**
 * Triggers a reminder
 * @param {Snowflake} id
 * @returns {Promise<void>}
 */
async function triggerReminder(id) {
	let reminder = reminders.get(id);
	let users = reminder.users;
	for (let userEntry of users) {
		let user = client.users.get(userEntry);
		await sendReminder(id, user);
	}
	reminders.delete(id);
	saveReminders();
	debug('Triggered reminder with id ' + id + '.');
}

/**
 * Deletes a reminder
 * @param {Snowflake} id
 */
function deleteReminder(id) {
	reminders.delete(id);
	saveReminders();
	debug('Deleted reminder with id ' + id + '.');
}

/**
 * Starts a reminder
 * @param {Snowflake} id
 * @returns {boolean}
 */
function startReminder(id) {
	let reminder = reminders.get(id);
	let now = new Date();
	let future = new Date(reminder.date);
	let timeDiff = future - now;
	// TODO REMOVE THIS AFTER FIXING ISSUE #8 >>>>>>>>>>>>>>>>
	if (timeDiff > 2147483651) {
		// Overflow for setTimeout
		let users = reminder.users;
		let userAmt = users.length - 1;
		let msgLink = reminder.msgLink;
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Sorry!')
			.setDescription(
				'Unfortunately I cannot remind you about [this message](<' + msgLink + '>) ' +
				(reminder.task.length > 0 ? '\nwith the task\n> ' + reminder.task + '\n' : '') +
				'on ' + reminder.date + ' since the date was too far in the future for me to handle.' +
				'\n[This is being worked on](https://github.com/Kaeks/wiktor-bot/issues/8)'
			);
		if (userAmt > 0) embed.setFooter(userAmt + ' other ' + (userAmt === 1 ? 'person' : 'people') + ' also cannot get this reminder.');
		for (let userEntry of users) {
			let user = client.users.get(userEntry);
			user.sendDm({ embed: embed });
		}
		deleteReminder(id);
		return false;
	}
	// TODO REMOVE THIS AFTER FIXING ISSUE #8 <<<<<<<<<<<<<<<<
	if (timeDiff < 0) {
		deleteReminder(id);
		return false;
	}
	let timer = setTimeout(function() {
		triggerReminder(id);
	}, timeDiff);
	runningReminders.set(id, {
		timer : timer,
		started : now
	});
	debug('Started reminder with id ' + id + '.');
}

/**
 * Starts all reminders
 */
function startAllReminders() {
	reminders.forEach((value, key) => {
		startReminder(key);
	});
	debug('Started all reminder timers.');
}

/**
 * Adds a user to the list of users of a reminder
 * @param {User} user
 * @param {Snowflake} id
 * @return {boolean} success
 */
function joinReminder(user, id) {
	let reminder = reminders.get(id);
	if (reminder.users.includes(user.id)) return false;
	reminder.users.push(user.id);
	saveReminders();
	log(user + ' joined reminder ' + id + '.');
	return true;
}

/**
 * Removes a user from the list of users of a reminder
 * @param {User} user
 * @param {Snowflake} id
 * @return {boolean} success
 */
function leaveReminder(user, id) {
	let reminder = reminders.get(id);
	if (!reminder.users.includes(user.id)) return false;
	reminder.users = reminder.users.filter(value => {
		return value !== user.id;
	});
	saveReminders();
	log(user + ' left reminder ' + id + '.');
	return true;
}

/**
 * Removes a user from the list of users of all reminders
 * @param {User} user
 */
function leaveAllReminders(user) {
	let userReminders = getRemindersOfUser(user);
	for (let reminderEntry of userReminders) {
		let reminder = reminderEntry[1];
		if (reminder.users.includes(user.id)) leaveReminder(user, reminder.id);
	}
	saveReminders();
}

/**
 * Saves reminders to storage
 */
function saveReminders() {
	Storage.reminders = Array.from(reminders);
	saveData();
	debug('Saved reminders.');
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

function getUsers() {
	return client.users.filter(user => {
		return user.bot === false
	});
}
