//// SETUP
// GLOBAL IMPORTS
const CronJob = require('cron').CronJob;
const Discord = require('discord.js');
const client = new Discord.Client();
const chrono = require('chrono-node');

const argumentValues = require('./enum/ArgumentValueEnum');
const colors = require('./enum/EmbedColorEnum');
const reactionEvents = require('./enum/ReactionEventEnum');
const permissionLevels = require('./enum/PermissionLevelEnum');
const roleNames = require('./enum/RoleNameEnum');

// Catch UnhandledPromiseRejection
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

/// EXPORTS
module.exports = {
	Discord, chrono, client
};

// IMPORTS
const common = require('./common');
const {
	fs,
	Config, Storage, Blocked, Deleted, Edited,
	saveData, saveBlocked, saveDeleted, saveEdited,
	updatePresence,
	sendWednesday
} = common;

const COMMAND_DIRECTORY = './commands';

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync(COMMAND_DIRECTORY).filter(file => file.match(/.js$/));
for (const file of commandFiles) {
	const command = require(COMMAND_DIRECTORY + '/' + file);
	client.commands.set(command.name, command);
}

// BAD WORDS
let badWordsText = fs.readFileSync('./storage/badwords.txt', 'utf-8');
let badWords = badWordsText.split(/\r\n?|\n/);

let specialChars = '[ ^°"$%&/()=?{}\\[\\]\\\\`´*+~#\'\\-_.:,;<>|]';
let joinedBadWords = badWords.join('|');
let badWordsRegExp = new RegExp('(?<=^|' + specialChars + ')(' + joinedBadWords + ')(?=$|' + specialChars + ')');

//// EVENTS
// START
client.on('ready', async () => {
	console.log('*hacker voice* I\'m in.');
	console.log(`Agent ${client.user.username} signing in.`);
	updatePresence();

	let now = new Date();
	common.log(now.toString());

	for (const guildEntry of client.guilds) {
		let guild = guildEntry[1];
		await setUpServer(guild);
	}

	// WATER SETUP
	common.loadWaterTimers();
	common.startAllWaterTimers();

	// REMINDER SETUP
	await common.loadReminders();
	common.filterReminders();
	common.startAllReminders();

	// CUSTOM FUNCTION SETUP
	common.loadCustomFunctions();
});

const notToDelete = [ 'reminder' ];

// MESSAGE
client.on('message', handleMessage);

// MESSAGE DELETED
client.on('messageDelete', message => {
	// Discard messages created by bots
	if (message.author.bot) return false;
	// Discard messages that were commands (and thus deleted by the bot)
	if (isCommand(message)) return false;

	common.log('Message by ' + message.author + ' deleted.');
	let shortened = {
		id: message.id,
		type: message.type,
		content: message.content,
		author: {
			id: message.author.id,
			username: message.author.username,
			discriminator: message.author.discriminator
		},
		channel: {
			type: message.channel.type,
			id: message.channel.id,
		}
	};
	if (message.embeds.length > 0) {
		shortened.embeds = message.embeds;
	}
	if (message.attachments.size > 0) {
		let shortenedAttachments = [];
		message.attachments.forEach(function(value) {
			shortenedAttachments.push(
				{
					id: value.id,
					filename: value.filename,
					url: value.url,
					proxyURL: value.proxyURL
				}
			);
		});
		shortened.attachments = shortenedAttachments;
	}
	Deleted.push(shortened);
	saveDeleted();
});

// MESSAGE UPDATED
client.on('messageUpdate', (oldMessage, newMessage) => {
	if (oldMessage.author.bot) {
		// discard messages created by bots
		return false;
	}
	common.log('Message by ' + oldMessage.author + ' edited.');
	let combinedEntry = {
		id: oldMessage.id,
		type: oldMessage.type,
		oldContent: oldMessage.content,
		newContent: newMessage.content,
		author: {
			id: oldMessage.author.id,
			username: oldMessage.author.username,
			discriminator: oldMessage.author.discriminator
		},
		channel: {
			type: oldMessage.channel.type,
			id: oldMessage.channel.id,
		}
	};
	Edited.push(combinedEntry);
	saveEdited();
});

function handleReaction(messageReaction, user, event) {
	if (user.bot) return false;
	let message = messageReaction.message;

	let listeners = common.reactionListeners;
	listeners.forEach(listener => {
		// Check if the message is being listened to and the reaction is accepted
		if (message.id === listener.msgId) {
			if (listener.reactions.includes(messageReaction.emoji.name)) {
				listener.fn(messageReaction, user, event);
			}
		}
	});
}

// REACTION ADDED TO MESSAGE
client.on('messageReactionAdd', (messageReaction, user) => {
	handleReaction(messageReaction, user, reactionEvents.ADD);
});

// REACTION REMOVED FROM MESSAGE
client.on('messageReactionRemove', ((messageReaction, user) => {
	handleReaction(messageReaction, user, reactionEvents.REMOVE);
}));

// ADDED TO SERVER
client.on('guildCreate', async guild => {
	common.log('Joined server \'' + guild.name + '\'.');
	await setUpServer(guild);
});

// REMOVED FROM SERVER
client.on('guildDelete', guild => {
	common.log('Whoa whoa whoa I just got kicked from ' + guild.name);
});

//// CRON
// WEDNESDAY
let wednesdayCronJob = new CronJob('0 0 * * 3', async function() {
	for (let serverEntry in Storage.servers) {
		if (!Storage.servers.hasOwnProperty(serverEntry)) continue;
		let cur = Storage.servers[serverEntry];
		if (!cur.channels.hasOwnProperty('wednesday')) continue;
		if (cur.disabledFeatures.wednesday !== true) {
			let channelEntry = cur.channels.wednesday;
			let channel = client.channels.get(channelEntry);
			sendWednesday(channel);
		}
	}
	for (let userEntry in Storage.users) {
		if (!Storage.users.hasOwnProperty(userEntry)) continue;
		let cur = Storage.users[userEntry];
		if (cur.hasOwnProperty('wednesday')) continue;
		if (cur.wednesday === true) {
			let user = client.users.get(userEntry);
			let channel = await user.getDmChannel();
			sendWednesday(channel);
		}
	}
}, null, true, 'Europe/Berlin');

//// METHODS
/**
 * Looks for a role with a specific name on a server
 * @param server
 * @param {String} roleName
 * @return {*}
 */
function findServerRoleFromName(server, roleName) {
	return server.roles.find(role => role.name === roleName);
}

/**
 * Looks for an existing Wiktor server owner role
 * @param server
 * @return {*}
 */
function findServerOwnerRole(server) {
	return findServerRoleFromName(server, roleNames.SERVER_OWNER);
}

/**
 * Looks for an existing Wiktor server superuser role
 * @param server
 * @return {*}
 */
function findServerSuperUserRole(server) {
	return findServerRoleFromName(server, roleNames.SERVER_SUPERUSER);
}

/**
 * Sets up database space for a server
 * @param server
 */
async function setUpServer(server) {
	if (!Storage.servers.hasOwnProperty(server.id)) {
		Storage.servers[server.id] = {};
		common.log('Added \'' + server.name + '\' to server list.');
	}
	let serverEntry = Storage.servers[server.id];
	if (!serverEntry.hasOwnProperty('channels')) {
		serverEntry.channels = {};
		common.log('Added \'channels\' property to \'' + server.name + '\'.');
	}
	if (!serverEntry.hasOwnProperty('roles')) {
		serverEntry.roles = {};
		common.log('Added \'roles\' property to \'' + server.name + '\'.');
	}
	if (!serverEntry.roles.hasOwnProperty('owner')) {
		let role;
		let foundRole = findServerOwnerRole(server);
		if (foundRole !== undefined && foundRole != null) {
			role = foundRole;
		} else {
			try {
				role = await server.createRole({
					name : roleNames.SERVER_OWNER,
					color : 'GREY',
					mentionable : false
				}, 'Wiktor Bot per-server permission system role setup.');
			} catch(e) {
				// error
				console.error();
			}
		}
		if (role !== undefined) {
			serverEntry.roles.owner = role.id;
			common.log('Added server owner role to \'' + server.name + '\'.');
		}
	}
	if (!serverEntry.roles.hasOwnProperty('superuser')) {
		let role;
		let foundRole = findServerSuperUserRole(server);
		if (foundRole !== undefined && foundRole != null) {
				role = foundRole;
		} else {
			try {
				role = await server.createRole({
					name : roleNames.SERVER_SUPERUSER,
					color : 'GREY',
					mentionable : false
				}, 'Wiktor Bot per-server permission system role setup.');
			} catch (e) {
				// error
				console.error(e);
			}
		}
		if (role !== undefined) {
			serverEntry.roles.superuser = role.id;
			common.log('Added server superuser role to \'' + server.name + '\'.');
		}
	}
	if (!serverEntry.hasOwnProperty('disabledFeatures')) {
		serverEntry.disabledFeatures = [];
		common.log('Added \'disabledFeatures\' property to \'' + server.name + '\'.');
	}
	saveData();
}

/**
 * Sets up database space for a user
 * @param msg
 * @param user
 */
function setUpUser(msg, user) {
	if (!Storage.users.hasOwnProperty(user.id)) {
		common.log('Added \'' + user + '\' to user list.');
		Storage.users[user.id] = {};
	}
	Storage.users[user.id].wednesday = Storage.users[user.id].wednesday || {};
	Storage.users[user.id].water = Storage.users[user.id].water || {};
	msg.channel.send(
		`Hey, ${user}! This seems to be your first time interacting with me. ` +
		`Make sure to enable DMs from users on this server to be able to receive personal messages used for a variety of my functions.`
	);
	saveData();
}

//// MESSAGE HANDLING
function handleMessage(msg) {
	if (msg.author.id === client.user.id) return false;
	if (isCommand(msg)) {
		handleCommand(msg);
		if (msg.channel.type === 'dm' || msg.channel.type === 'group') return false;
		if (msg.guild.me.permissions.has('MANAGE_MESSAGES')) {
			if (!notToDelete.includes(getCommandName(msg))) {
				msg.delete(5000);
			}
		}
	} else {
		// Message is not a command, handle non-command interactions
		let eatAss = msg.content.match(/(?:^|[\s])((eat\sass)|(eat\s.*\sass))(?=\s|$)/i);
		let ummah = msg.content.match(/u((mah+)|(m{2,}ah*))/i);
		if (msg.mentions.everyone) {
			msg.channel.send("@everyone? Really? @everyone? Why would you ping @everyone, " + msg.author + "?");
			return;
		}
		if (msg.isMentioned(client.user)) {
			if (ummah) {
				if (eatAss) {
					msg.channel.send('Gladly, ' + msg.author + ' UwU');
				} else {
					msg.channel.send(msg.author + ' :kiss:');
				}
			} else if (eatAss) {
				msg.channel.send('Hey, ' + msg.author + ', how about you eat mine?');
			} else {
				msg.channel.send('wassup ' + msg.author);
			}
		} else {
			if (eatAss) {
				msg.channel.send('Hey, ' + msg.author + ', that\'s not very nice of you!');
			} else if (Config.badWordFilter === true) {
				if (msg.content.match(badWordsRegExp)) {
					msg.channel.send('Whoa there buddy. You said a nasty word, ' + msg.author + '!')
				}
			}
		}
	}
}

//// COMMAND HANDLING
/**
 * Recursive function to execute a command - sub-command chain
 * @param msg
 * @param suffix
 * @param command
 * @returns {boolean} success
 */
function findSubCommand(msg, suffix, command) {
	// Variable for determining whether a (sub-)command can be executed with the suffix or not
	let isValidUse = false;

	if (suffix == null) {
		// Suffix is empty
		// Command doesn't require arguments ✔
		// Command doesn't have a standalone function ✔
		if (![argumentValues.REQUIRED, argumentValues.NULL].includes(command.args)) isValidUse = true;
	} else {
		// Suffix is not empty
		// Get a list individual (possible) sub-commands
		let splitList = suffix.split(/ +/);
		let firstArg = splitList[0];

		// If there is a sub-command, go through to it and look recursively
		// If there is no sub-command and the current command accepts / requires arguments, continue with execution
		if (command.sub.has(firstArg)) {
			let temp = suffix.substring(firstArg.length);
			let match = temp.match(/ +/);
			let subCommand = command.sub.get(firstArg);

			let user = msg.author;

			if (user.getPermissionLevel(msg) < subCommand.permissionLevel) {
				common.debug('User ' + user.getHandle() + ' does not have the required permission level for that sub-command.');
				msg.channel.send('I\'m sorry, ' + user + ', you do not have permission to execute that sub-command.');
				return false;
			}

			let newSuffix = match !== null ? temp.substring(match[0].length) : null;

			return findSubCommand(msg, newSuffix, subCommand);
		} else if (command.args === argumentValues.REQUIRED || command.args === argumentValues.OPTIONAL) {
			isValidUse = true;
		}
	}

	// If the use is valid, execute it
	// If the use is not valid, display help
	let commandString = common.combineCommandChain(command.getCommandChain());
	if (isValidUse) {
		let suffixString = suffix == null ? '' : ' with suffix: \'' + suffix + '\'';
		common.log('User ' + msg.author.getHandle() + ' issued command \'' + commandString + '\'' + suffixString + '.');
		if (command.hasOwnProperty('execute')) {
			command.execute(msg, suffix);
			return true;
		} else {
			common.warn('Command \'' + commandString + '\' has not been implemented.');
			let embed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('Not available!')
				.setDescription('The command `' + Config.prefix + commandString + '` doesn\'t have an implemented function.');
			msg.channel.send({ embed: embed });
			return false;
		}
	} else {
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Help for ' + commandString);
			embed.setDescription(common.getCommandHelp(command));
		msg.channel.send({ embed: embed });
	}
	return false;
}

/**
 * Returns whether or not a user is blocked from using bot features.
 * @param user
 * @returns {boolean}
 */
function isBlocked(user) {
	return Blocked.includes(user.id);
}

/**
 * Returns whether or not a message is to be handled as a command by the bot.
 * @param msg
 * @returns {boolean} success
 */
function isCommand(msg) {
	// Check whether the message was issued by another user
	if (msg.author === client.user) return false;
	// Check whether the message starts with the bot's prefix
	if (!msg.content.startsWith(Config.prefix)) return false;

	const split = msg.content.slice(Config.prefix.length).split(/ +/);
	const commandName = split[0].toLowerCase();
	return client.commands.has(commandName);
}

/**
 * Get the name of the command in the message.
 * @param {*} msg
 */
function getCommandName(msg) {
	const split = msg.content.slice(Config.prefix.length).split(/ +/);
	return split[0].toLowerCase();
}

/**
 * Handles a command inside a message
 * @param msg
 * @returns {boolean} success
 */
function handleCommand(msg) {
	let user = msg.author;
	// Filter out blocked users
	if (isBlocked(user)) {
		common.debug('User ' + user.getHandle() + ' is on blocked user list.');
		msg.channel.send('I\'m sorry, ' + user + ', you\'ve been blocked from using me.');
		return false;
	}

	// Create database space for the message author
	if (!Storage.users.hasOwnProperty(user.id)) setUpUser(msg, user);

	const commandName = getCommandName(msg);
	common.debug('commandName: ' + commandName);
	const command = client.commands.get(commandName);

	let commandPermissionLevel = command.permissionLevel || permissionLevels.NONE;

	if (user.getPermissionLevel(msg) < commandPermissionLevel) {
		common.debug('User ' + user.getHandle() + ' does not have the required permission level for that command.');
		msg.channel.send('I\'m sorry, ' + user + ', you do not have permission to execute that command.');
		return false;
	}

	let temp = msg.content.substring(Config.prefix.length + commandName.length);
	let match = temp.match(/ +/);

	const suffix = match !== null ? temp.substring(match[0].length) : null;
	common.debug('suffix: ' + suffix);
	try {
		findSubCommand(msg, suffix, command);
		return true;
	} catch (e) {
		console.error(e.stack);
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Internal Error!')
			.setDescription('Command `' + commandName + '` failed.');
		msg.channel.send({ embed: embed });
	}
	return false;
}

//// ENTRY POINT
client.login(Config.devMode ? Config.devToken : Config.token).catch(console.error);
