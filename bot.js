//// SETUP
// IMPORTS
const fs = require('fs');
const Discord = require('discord.js');
const CronJob = require('cron').CronJob;
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
require('datejs');

const common = require('./common.js');

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.match(/.js$/));
for (const file of commandFiles) {
	const command = require('./commands/' + file);
	client.commands.set(command.name, command);
}

//
let waterTimers = {};
let runningTimers = {};

let Storage = {};
try {
	Storage = require('./data.json');
	common.debug('Read data.json');
} catch (e) {
	writeData();
}

let Blocked = {};
try {
	Blocked = require('./blocked_users.json');
	common.debug('Read blocked_users.json');
} catch (e) {
	fs.writeFileSync('./blocked_users.json', JSON.stringify(Blocked, null, 2));
}

Blocked.users = Blocked.users || [];
Storage.debug = Storage.debug || true;
Storage.servers = Storage.servers || {};
Storage.users = Storage.users || {};
Storage.reminders = Storage.reminders || [];

writeData();
fs.writeFileSync('./blocked_users.json', JSON.stringify(Blocked, null, 2));

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

//// EVENTS
// START
client.on('ready', () => {
	console.log('*hacker voice* I\'m in.');
	console.log(`Agent ${client.user.username} signing in.`);
	updatePresence();

	common.debug(Date.now().toString());

	for (let guild of client.guilds) {
		setUpServer(guild[1]);
	}

	loadWaterTimers();
	common.debug(waterTimers);
	common.debug(runningTimers);
	startAllWaterTimers();
	common.debug(runningTimers);

	common.debug(Storage);
	writeData();

});

// MESSAGE
client.on('message', msg => {
	if (checkMessageForCommand(msg)) {
		if (msg.channel.type !== 'dm' && msg.channel.type !== 'group') {
			setTimeout(function() {
				msg.delete().then(common.debug, console.error);
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

// ADDED TO SERVER
client.on('guildCreate', guild => {
	console.log('Joined server \'' + guild.name + '\'.');
	setUpServer(guild);
});

// REMOVED FROM SERVER
client.on('guildDelete', guild => {
	console.log('Whoa whoa whoa I just got kicked from ' + guild.name);
});

//// METHODS

function getTimeZone(user) {
	return Storage.users[user.id].timeZone;
}

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

async function sendDM(userId, message) {
	let cur = client.users.get(userId);
	let channel = await cur.createDM();
	channel.send(message)
		.then(common.debug, console.error);
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

function setUpServer(server) {
	if (!Storage.servers.hasOwnProperty(server.id)) {
		console.log('Added \'' + server.name + '\' to server list.');
		Storage.servers[server.id] = {};
	}
	Storage.servers[server.id].channels = Storage.servers[server.id].channels || {};
	Storage.servers[server.id].disabledFeatures = Storage.servers[server.id].disabledFeatures || {};
	writeData();
}

function setUpUser(user) {
	if (!Storage.users.hasOwnProperty(user.id)) {
		console.log('Added \'' + user + '\' to user list.');
		Storage.users[user.id] = {};
	}
	Storage.users[user.id].wednesday = Storage.users[user.id].wednesday || {};
	Storage.users[user.id].water = Storage.users[user.id].water || {};
	Storage.users[user.id].timeZone = Storage.users[user.id].timeZone || '+0100';
	writeData();
}

function writeData() {
	fs.writeFileSync('./data.json', JSON.stringify(Storage, null, 2));
}

function sendWednesday(channelID) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(0x00AE86)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	client.channels.get(channelID).send({embed});
}

function updatePresence(status, name, type, url) {
	status = status || 'available';
	name = name || prefix + 'help';
	type = type || 'LISTENING';
	url = url || 'https://www.github.com/Kaeks/abuse-bot';
	client.user.setStatus(status)
		.then(common.debug, console.error);
	client.user.setPresence({
		game : {
			name : name,
			type : type,
			url: url
		}
	}).then(common.debug, console.error);
}

function findSubCommand(msg, suffix, command) {

	let canExecute = false;

	common.debug('SUFFIX: ' + suffix);
	let splitList = suffix.split(' ');
	common.debug('SPLIT LIST: ');
	common.debug(splitList);
	let firstArg = splitList[0];
	common.debug('FIRST ARG: ' + firstArg);

	if (firstArg === '') {
		if (command.args !== common.argumentValues.REQUIRED) canExecute = true;
	}

	let newSuffix = suffix.substring(firstArg.length + 1);
	common.debug('NEW SUFFIX: ' + newSuffix);

	let subIndex = -1;

	if (command.hasOwnProperty('sub')) {
		for (let i = 0; i < command.sub.length; i++) {
			if (command.sub[i].name === firstArg.toLowerCase()) {
				subIndex = i;
				break;
			}
		}
	}

	if (subIndex >= 0) findSubCommand(msg, newSuffix, command.sub[subIndex]);
	else if (command.args === common.argumentValues.REQUIRED || command.args === common.argumentValues.OPTIONAL) canExecute = true;

	if (canExecute) {
		command.execute(msg, suffix);
		return true;
	} else {
		// display help
		console.log(common.getCommandHelp(command));
	}
	return false;
}

function checkMessageForCommand(msg) {
	// Check whether the message was issued by another user
	if (msg.author.id === client.user.id) return false;
	if (!msg.content.startsWith(prefix)) return false;
	if (!Storage.users.hasOwnProperty(msg.author.id)) setUpUser(msg.author);

	// Filter out blocked users
	if (Blocked.users.includes(msg.author.id)) {
		console.log('User is on blocked user list');
		msg.channel.send('I\'m sorry, ' + msg.author + ', you\'ve been blocked from using me.');
		return false;
	}

	//	/([^\"\']\S*|\".+?\"|\'.+?\')\s*/g

	const commandName = msg.content.slice(prefix.length).split(' ')[0].toLowerCase();
	common.debug('commandName: ' + commandName);
	const suffix = msg.content.substring(commandName.length + prefix.length + 1);
	common.debug('suffix: ' + suffix);

	if (!client.commands.has(commandName)) return false;

	const command = client.commands.get(commandName);

	try {
		findSubCommand(msg, suffix, command);
		return true;
	} catch (e) {
		console.log(e.stack);
		msg.channel.send('Internal Error. Command `' + commandName + '` failed.').then(common.debug, console.error);
	}
	return false;
}

client.login(token)
	.then(common.debug, console.error);
