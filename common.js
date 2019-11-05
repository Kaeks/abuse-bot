const fs = require('fs');
const Discord = require('discord.js');
const { debugMode, prefix } = require('./config.json');
const { client } = require('./bot.js');

// CONSTANTS
const DATA_PATH = './data.json';
const BLOCKED_PATH = './blocked_users.json';
const DELETED_PATH = './deleted_messages.json';
const EDITED_PATH = './edited_messages.json';

// SHARED VARS
let waterTimers = {};
let runningTimers = {};

// DATA VARS
let Storage = {};
let Blocked = [];
let Deleted = [];
let Edited = [];

Storage = loadFile(DATA_PATH, Storage);
Blocked = loadFile(BLOCKED_PATH, Blocked);
Deleted = loadFile(DELETED_PATH, Deleted);
Edited = loadFile(EDITED_PATH, Edited);

Storage.servers = Storage.servers || {};
Storage.users = Storage.users || {};
Storage.reminders = Storage.reminders || [];

saveFile(DATA_PATH, Storage);
saveFile(BLOCKED_PATH, Blocked);
saveFile(DELETED_PATH, Deleted);
saveFile(EDITED_PATH, Edited);

// ENUM
let argumentValues = {
	NONE : 0,
	OPTIONAL : 1,
	REQUIRED : 2
};

//// EXPORTS
module.exports = {
	fs,
	Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveData, saveBlocked, saveDeleted, saveEdited,
	argumentValues,
	info,
	warn,
	debug,
	sendDM,
	sendWednesday,
	unparseDate,
	combineCommandChain,
	getHelpRow,
	getCommandHelp,
	getFullHelpEmbed
};

//// METHODS
// CONSOLE
function info(msg) {
	console.log('\x1b[33m%s\x1b[0m', `[INFO] ${msg}`);
}

function warn(msg) {
	console.log('\x1b[31m%s\x1b[0m', `[WARN] ${msg}`);
}

function debug(msg) {
	if (debugMode) {
		if (msg instanceof Object) {
			console.log('\x1b[36m%s\x1b[0m', '[DEBUG]');
			console.log(msg);
		} else {
			console.log('\x1b[36m%s\x1b[0m', `[DEBUG] ${msg}`);
		}
	}
}

// FILESYSTEM
function loadFile(path, variable) {
	let temp;
	try {
		temp = require(path);
		debug('Read ' + path);
	} catch (e) {
		fs.writeFileSync(path, JSON.stringify(variable, null, 2));
		info('Created ' + path);
	}
	return temp || variable;
}

function saveFile(path, variable) {
	fs.writeFileSync(path, JSON.stringify(variable, null, 2));
}

// SPECIFIC SAVES
function saveData() 	{saveFile(DATA_PATH, 	Storage);	}
function saveBlocked()	{saveFile(BLOCKED_PATH, Blocked);	}
function saveDeleted() 	{saveFile(DELETED_PATH, Deleted);	}
function saveEdited() 	{saveFile(EDITED_PATH, 	Edited);	}

// HELPERS
/**
 * Send a DM to a user.
 * Should the DM channel not exist, it will be created first.
 *
 * @param userId
 * @param message
 * @returns {Promise<*>}
 */
async function sendDM(userId, message) {
	let cur = client.users.get(userId);
	let channel = await cur.createDM();
	return channel.send(message);
}

function unparseDate(date) {
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
	let base = '`' + prefix + commandString + ' ' + usage + '`' + '\n';
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
	} else if (!(command.hasOwnProperty('args') && command.args)) info(`Command '${commandString}' doesn't have a usage property.`);

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
 * @param channelId
 */
function sendWednesday(channelId) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(0x00AE86)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	client.channels.get(channelId).send({embed});
}

// WATER
function loadWaterTimers() {
	for (let user in Storage.users) {
		if (!Storage.users.hasOwnProperty(user)) continue;
		if (!Storage.users[user].hasOwnProperty('water')) continue;
		if (Storage.users[user].water.enabled === true) {
			addWaterTimer(user, Storage.users[user].water.interval);
		}
	}
}

function addWaterTimer(user, interval) {
	waterTimers[user] = interval;
}

function startAllWaterTimers() {
	for (let userId in waterTimers) {
		if (!waterTimers.hasOwnProperty(userId)) continue;
		startWaterTimer(userId);
	}
}

function startWaterTimer(userId) {
	let now = (new Date()).getTime();
	common.debug('[startWaterTimer]: ' + waterTimers[userId]);
	common.debug(waterTimers);
	let curTimer = setInterval(function() {
		sendWater(userId);
	}, waterTimers[userId] * 60000);
	if (runningTimers[userId] == null) {
		runningTimers[userId] = {};
	}
	runningTimers[userId].timer = curTimer;
	runningTimers[userId].started = now;
}

function stopWaterTimer(userId) {
	if (runningTimers[userId] == null) {
		return false;
	}
	clearInterval(runningTimers[userId].timer);
	runningTimers[userId] = null;
}

function updateWaterTimer(userId) {
	stopWaterTimer(userId);
	waterTimers[userId] = Storage.users[userId].water.interval;
	startWaterTimer(userId);
}

function getWaterTimerStatus(userId) {
	let now = (new Date()).getTime();
	return (runningTimers[userId].started + waterTimers[userId] * 1000) - now;
}

function sendWater(userId) {
	let user = client.users.get(userId);
	runningTimers[userId].started = (new Date()).getTime();
	if (user.presence.status === 'offline' || user.presence.status === 'dnd') {
		return false;
	}
	let embed = new Discord.RichEmbed()
		.setTitle('Stay hydrated!')
		.setDescription('Drink some water **now**.')
		.setThumbnail('https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192');
	return sendDM(userId, {embed});
}