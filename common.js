const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const { client } = require('./bot.js');

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
/*
	'args' property for commands:
	NULL:		command doesn't have its own execute function
				'' 		❌
				'foo'	❌
	NONE: 		arguments are NOT ACCEPTED
				'' 		✔
				'foo'	❌
	OPTIONAL: 	arguments are OPTIONAL
				'' 		✔
				'foo'	✔
	REQUIRED: 	arguments are REQUIRED
				'' 		❌
				'foo'	✔

	⚠ THIS DOES NOT INCLUDE SUB-COMMANDS ⚠
	* A command with only sub-commands but no standalone function is NONE
	* A command with sub-commands and a standalone function can be OPTIONAL or REQUIRED,
		 depending on whether the standalone function CAN or MUST receive an argument.
 */
let argumentValues = {
	NULL : -1,
	NONE : 0,
	OPTIONAL : 1,
	REQUIRED : 2
};

//// EXPORTS
module.exports = {
	fs, client,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveConfig, saveData, saveBlocked, saveDeleted, saveEdited,
	argumentValues,
	debug, log, info, warn,
	simplifyCollection,
	getDmChannel,
	updatePresence,
	parseDate,
	sendWednesday,
	combineCommandChain,
	getHelpRow, getCommandHelp, getFullHelpEmbed,
	waterTimers, runningWaterTimers,
	sendWater, addWaterTimer, loadWaterTimers, startWaterTimer, startAllWaterTimers, stopWaterTimer, updateWaterTimer, getWaterTimerStatus,
	reminders, runningReminders, getReminders, getRemindersOfUser,
	addReminder, loadReminders, startReminder, startAllReminders, filterReminders, leaveAllReminders, joinReminder, leaveReminder,
	getMessageLink, getBooleanValue, getUsers
};

//// METHODS
// CONSOLE
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

function log(msg) {
	if (msg instanceof Object) {
		console.log('\x1b[2m%s\x1b[0m', '[LOG]');
		console.log(msg);
	} else {
		console.log('\x1b[2m%s\x1b[0m', `[LOG] ${msg}`);
	}
}

function info(msg) {
	console.log('\x1b[33m%s\x1b[0m', `[INFO] ${msg}`);
}

function warn(msg) {
	console.log('\x1b[31m%s\x1b[0m', `[WARN] ${msg}`);
}

// FILESYSTEM
function loadFile(filePath, variable) {
	let temp;
	try {
		temp = require(filePath);
		debug('Read ' + filePath);
	} catch (e) {
		fs.writeFileSync(filePath, JSON.stringify(variable, null, 2));
		info('Created ' + filePath);
	}
	return temp || variable;
}

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
function updatePresence(status = 'online', name = Config.prefix + 'help', type = 'LISTENING', url = 'https://www.github.com/Kaeks/wiktor-bot') {
	client.user.setPresence({
		status: status,
		game : {
			name : name,
			type : type,
			url: url
		}
	}).catch(console.error);
}

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
 *
 * @param commandString
 * @param usage
 * @param description
 * @returns {string}
 */
function getHelpRow(commandString, usage, description) {
	let base = '`' + Config.prefix + commandString + ' ' + usage + '`' + '\n';
	return description === undefined ? base : base + '-- ' + description + '\n';
}

/**
 * Returns a list of possible uses of a command as a string
 *
 * @param command
 * @param commandChain
 * @returns {string}
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
 *
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
 *
 * @param channel
 */
function sendWednesday(channel) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(0x00AE86)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	channel.send({ embed: embed });
}

// WATER
async function sendWater(user) {
	runningWaterTimers[user.id].started = new Date();
	if (user.presence.status === 'offline' || (user.presence.status === 'dnd' && Storage.users[user.id].water.ignoreDnD !== true)) {
		return false;
	}
	let embed = new Discord.RichEmbed()
		.setTitle('Stay hydrated!')
		.setDescription('Drink some water **now**.')
		.setThumbnail('https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192');
	let channel = await getDmChannel(user);
	channel.send({ embed: embed });
}

function addWaterTimer(user) {
	waterTimers[user.id] = Storage.users[user.id].water.interval;
}

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

function startAllWaterTimers() {
	for (let userEntry in waterTimers) {
		if (!waterTimers.hasOwnProperty(userEntry)) continue;
		let user = client.users.get(userEntry);
		startWaterTimer(user);
	}
	debug('Started all water timers.');
}

function stopWaterTimer(user) {
	if (runningWaterTimers[user.id] === undefined) {
		return false;
	}
	clearInterval(runningWaterTimers[user.id].timer);
	runningWaterTimers[user.id] = undefined;
}

function updateWaterTimer(user) {
	stopWaterTimer(user);
	waterTimers[user.id] = Storage.users[user.id].water.interval;
	startWaterTimer(user);
}

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

function getMessageLink(msg) {
	return 'http://discordapp.com/channels/' + ((msg.channel.type === 'text') ? msg.guild.id : '@me') + '/' + msg.channel.id + '/' + msg.id;
}

function addReminder(msg, date, task, botMsg) {
	let msgLink = getMessageLink(msg);
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
	Storage.reminders = Array.from(reminders);
	saveData();
	debug('Added reminder with id ' + id + ':');
	debug(reminder);
	startReminder(id);
}

function loadReminders() {
	reminders = new Discord.Collection(Storage.reminders);
	debug('Loaded all reminders.');
}

async function notifyOldReminders(collection) {
	let usersWithOldReminders = getUsersWithReminders(collection);
	for (const userEntry of usersWithOldReminders) {
		let user = userEntry[1];
		let oldReminders = getRemindersOfUser(user, collection);
		let tempText = 'I couldn\'t remind you of these tasks:\n';
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
			.setColor(0XAE0028)
			.setTitle('Sorry!')
			.setDescription(tempText);
		let channel = await getDmChannel(user);
		channel.send({ embed: embed });
	}
}

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

function getReminders() {
	return reminders;
}

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

function getRemindersOfUser(user, collection = reminders) {
	return collection.filter(value => {
		return value.users.includes(user.id);
	});
}

function simplifyCollection(collection) {
	let simple = new Discord.Collection();
	let counter = 0;
	collection.forEach(value => {
		simple.set(counter, value);
		counter++;
	});
	return simple;
}

async function sendReminder(id, user) {
	let reminder = reminders.get(id);
	let msgLink = reminder.msgLink;
	let task = reminder.task;
	let userAmt = reminder.users.length - 1;
	let embed = new Discord.RichEmbed()
		.setColor(0x00AE86)
		.setTitle('Reminder!')
		.setDescription('I\'m here to remind you about [this message](<' + msgLink + '>).\nThe task was:\n> ' + task);
	if (userAmt > 0) embed.setFooter(userAmt + ' other ' + (userAmt === 1 ? 'person' : 'people') + ' also got this reminder!');
	let channel = await getDmChannel(user);
	channel.send({ embed: embed });
}

function triggerReminder(id) {
	let reminder = reminders.get(id);
	let users = reminder.users;
	for (let userEntry of users) {
		let user = client.users.get(userEntry);
		sendReminder(id, user);
		reminders.delete(id);
		saveReminders();
	}
	debug('Triggered reminder with id ' + id + '.');
}

function startReminder(id) {
	let reminder = reminders.get(id);
	let now = new Date();
	let future = new Date(reminder.date);
	let timeDiff = future - now;
	console.log(timeDiff);
	if (timeDiff < 0 ) return false; //TODO reminder is in past handling
	let timer = setTimeout(function() {
		triggerReminder(id);
	}, timeDiff);
	runningReminders.set(id, {
		timer : timer,
		started : now
	});
	debug('Started reminder with id ' + id + '.');
}

function startAllReminders() {
	reminders.forEach((value, key) => {
		startReminder(key);
	});
	debug('Started all reminder timers.');
}

function joinReminder(user, id) {
	let reminder = reminders.get(id);
	if (!reminder.users.includes(user.id)) reminder.users.push(user.id);
	saveReminders();
	console.log(user + ' joined reminder');
	console.log(reminder);
}

function leaveReminder(user, id) {
	let reminder = reminders.get(id);
	if (reminder.users.includes(user.id)) reminder.users = reminder.users.filter(value => {
		return value !== user.id;
	});
	saveReminders();
	console.log(user + ' left reminder');
	console.log(reminder);
}

function leaveAllReminders(user) {
	let userReminders = getRemindersOfUser(user);
	for (let reminderEntry of userReminders) {
		let reminder = reminderEntry[1];
		if (reminder.users.includes(user.id)) leaveReminder(user, reminder.id);
	}
	saveReminders();
}

function saveReminders() {
	Storage.reminders = Array.from(reminders);
	saveData();
	debug('Saved reminders.');
}

async function getDmChannel(user) {
	if (user.bot) return undefined;
	if (user.dmChannel != null) return user.dmChannel;
	return await user.createDM();
}

function getBooleanValue(suffix) {
	let newVal;
	if (suffix === 'true') {
		newVal = true;
	} else if (suffix === 'false') {
		newVal = false;
	}
	return newVal
}

function getUsers() {return client.users.filter(user => {return user.bot === false})}
