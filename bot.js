//// SETUP
// IMPORTS
const Discord = require('discord.js');
const CronJob = require('cron').CronJob;
const client = new Discord.Client();
require('datejs');

/// EXPORTS
module.exports = {
	client
};

const common = require('./common.js');
const {
	fs,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveData, saveBlocked, saveDeleted, saveEdited,
	waterTimers, runningTimers,
	sendDM, updatePresence,
	sendWednesday
} = common;

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.match(/.js$/));
for (const file of commandFiles) {
	const command = require('./commands/' + file);
	client.commands.set(command.name, command);
}

//// EVENTS
// START
client.on('ready', () => {
	console.log('*hacker voice* I\'m in.');
	console.log(`Agent ${client.user.username} signing in.`);
	updatePresence();

	let now = new Date();
	common.debug(now.toString());

	for (let guild of client.guilds) {
		setUpServer(guild[1]);
	}

	//loadWaterTimers();
	common.debug(waterTimers);
	common.debug(runningTimers);
	//startAllWaterTimers();
	common.debug(runningTimers);

	common.debug(Storage);
	saveData();

});

// MESSAGE
client.on('message', msg => {
	if (checkMessageForCommand(msg)) {
		if (msg.channel.type !== 'dm' && msg.channel.type !== 'group') {
			setTimeout(function() {
				msg.delete().catch(console.error);
			}, 3000);
		}
	} else {
		// Message is not a command
		// Any actions for non-bot-message interactions that are not commands come here
		// ->

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
			if (eatAss)	{
				msg.channel.send('Hey, ' + msg.author + ', that\'s not very nice of you!');
			}
		}
	}
});

// MESSAGE DELETED
client.on('messageDelete', message => {
	if (message.author.bot) {
		// discard messages created by bots
		return false;
	}
	console.log('Message by ' + message.author + ' deleted.');
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
	console.log('Message by ' + oldMessage.author + ' edited.');
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

// ADDED TO SERVER
client.on('guildCreate', guild => {
	console.log('Joined server \'' + guild.name + '\'.');
	setUpServer(guild);
});

// REMOVED FROM SERVER
client.on('guildDelete', guild => {
	console.log('Whoa whoa whoa I just got kicked from ' + guild.name);
});

//// CRON
// WEDNESDAY
let wednesdayCronJob = new CronJob('0 0 * * 3', async function() {
	for (let serverId in Storage.servers) {
		if (!Storage.servers.hasOwnProperty(serverId)) continue;
		let cur = Storage.servers[serverId];
		if (!cur.channels.hasOwnProperty('wednesday')) continue;
		if (cur.disabledFeatures.wednesday !== true) {
			let channel = cur.channels.wednesday;
			sendWednesday(channel);
		}
	}
	for (let userId in Storage.users) {
		if (!Storage.users.hasOwnProperty(userId)) continue;
		let cur = Storage.users[userId];
		if (cur.hasOwnProperty('wednesday')) continue;
		if (cur.wednesday === true) {
			let channel = await client.users.get(userId).createDM();
			sendWednesday(channel.id);
		}
	}
}, null, true, 'Europe/Berlin');

//// METHODS
function getTimeZone(user) {
	return Storage.users[user.id].timeZone;
}

function setUpServer(server) {
	if (!Storage.servers.hasOwnProperty(server.id)) {
		console.log('Added \'' + server.name + '\' to server list.');
		Storage.servers[server.id] = {};
	}
	Storage.servers[server.id].channels = Storage.servers[server.id].channels || {};
	Storage.servers[server.id].disabledFeatures = Storage.servers[server.id].disabledFeatures || {};
	saveData();
}

function setUpUser(user) {
	if (!Storage.users.hasOwnProperty(user.id)) {
		console.log('Added \'' + user + '\' to user list.');
		Storage.users[user.id] = {};
	}
	Storage.users[user.id].wednesday = Storage.users[user.id].wednesday || {};
	Storage.users[user.id].water = Storage.users[user.id].water || {};
	Storage.users[user.id].timeZone = Storage.users[user.id].timeZone || '+0100';
	saveData();
}

//// COMMAND HANDLING
function findSubCommand(msg, suffix, command, commandChain = []) {
	let localCommandChain = commandChain.slice();
	localCommandChain.push(command);
	let commandString = common.combineCommandChain(localCommandChain);

	let canExecute = false;

	if (suffix == null) {
		// Suffix is empty
		if (command.args !== common.argumentValues.REQUIRED) canExecute = true;
	} else {
		// Suffix is not empty
		let splitList = suffix.split(/ +/);
		let firstArg = splitList[0];

		// subIndex is the index where the sub-command lies within the list of commands
		let subIndex = -1;

		if (command.hasOwnProperty('sub')) {
			for (let i = 0; i < command.sub.length; i++) {
				if (command.sub[i].name === firstArg.toLowerCase()) {
					subIndex = i;
					break;
				}
			}
		}

		// if there is a sub-command, go through to it
		if (subIndex >= 0) {
			let temp = suffix.substring(firstArg.length);
			let match = temp.match(/ +/);

			let newSuffix = match !== null ? temp.substring(match[0].length) : null;
			return findSubCommand(msg, newSuffix, command.sub[subIndex], localCommandChain);
		} else if (command.args === common.argumentValues.REQUIRED || command.args === common.argumentValues.OPTIONAL) {
			// if there is no sub-command and args are required / optional
			canExecute = true;
		}
	}

	if (canExecute) {
		common.debug('Executing command \'' + commandString + '\' with suffix: \'' + suffix + '\'');
		command.execute(msg, suffix);
		return true;
	} else {
		let embed = new Discord.RichEmbed()
			.setColor('00AE86')
			.setTitle('Help for ' + commandString)
			.setDescription(common.getCommandHelp(command, commandChain));
		msg.channel.send({embed});
	}
	return false;
}

function checkMessageForCommand(msg) {
	// Check whether the message was issued by another user
	if (msg.author.id === client.user.id) return false;
	if (!msg.content.startsWith(Config.prefix)) return false;
	if (!Storage.users.hasOwnProperty(msg.author.id)) setUpUser(msg.author);

	// Filter out blocked users
	if (Blocked.includes(msg.author.id)) {
		common.debug('User is on blocked user list');
		msg.channel.send('I\'m sorry, ' + msg.author + ', you\'ve been blocked from using me.');
		return false;
	}

	const split = msg.content.slice(Config.prefix.length).split(/ +/);
	const commandName = split[0].toLowerCase();
	common.debug('commandName: ' + commandName);

	if (!client.commands.has(commandName)) return false;
	const command = client.commands.get(commandName);

	let temp = msg.content.substring(Config.prefix.length + commandName.length);
	let match = temp.match(/ +/);

	const suffix = match !== null ? temp.substring(match[0].length) : null;
	common.debug('suffix: ' + suffix);

	try {
		findSubCommand(msg, suffix, command);
		return true;
	} catch (e) {
		console.error(e.stack);
		msg.channel.send('Internal Error. Command `' + commandName + '` failed.').catch(console.error);
	}
	return false;
}

//// ENTRY POINT
client.login(Config.token)
	.catch(console.error);
