//// SETUP
// IMPORTS
const fs = require('fs');
const Discord = require('discord.js');
const auth = require('./auth.json');
const token = auth.token;
const CronJob = require('cron').CronJob;
const bot = new Discord.Client();
require('datejs');

bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWidth('.js'));
for (const file of commandFiles) {
	const command = require('./commands/' + file);
	client.commands.set(command.name, command);
}

//
let waterTimers = {};
let runningTimers = {};

let Storage = {};
try {
	Storage = require('./vars.json');
	debugLog('Read vars.json');
} catch (e) {
	saveVars();
}

let Blocked = {};
try {
	Blocked = require('./blocked_users.json');
	debugLog('Read blocked_users.json');
} catch (e) {
	fs.writeFileSync('./blocked_users.json', JSON.stringify(Blocked, null, 2));
}

Blocked.users = Blocked.users || [];
Storage.prefix = Storage.prefix || '!';
Storage.debug = Storage.debug || true;
Storage.servers = Storage.servers || {};
Storage.users = Storage.users || {};
Storage.reminders = Storage.reminders || [];

for (let server in Storage.servers) {
	if (Storage.servers.hasOwnProperty(server)) {
			Storage.servers[server].channels = Storage.servers[server].channels || {};
			Storage.servers[server].disabledFeatures = Storage.servers[server].disabledFeatures || {};
	}
}

saveVars();
fs.writeFileSync('./blocked_users.json', JSON.stringify(Blocked, null, 2));

let wednesdayCronJob = new CronJob('0 0 * * 3', async function() {
	for (let server in Storage.servers) {
		if (Storage.servers.hasOwnProperty(server)) {
			let cur = Storage.servers[server];
			if (cur.channels.hasOwnProperty('wednesday')) {
				if (cur.disabledFeatures.wednesday !== true) {
					let channel = cur.channels.wednesday;
					sendWednesday(channel);
				}
			}
		}
	}
	for (let user in Storage.users) {
		if (Storage.users.hasOwnProperty(user)) {
			let cur = Storage.users[user];
			if (cur.hasOwnProperty('wednesday')) {
				if (cur.wednesday === true) {
					let channel = await bot.users.get(user).createDM();
					sendWednesday(channel.id);
				}
			}
		}
	}
}, null, true, 'Europe/Berlin');

//// EVENTS

// START
bot.on('ready', () => {
	console.log('*hacker voice* I\'m in.');
	console.log(bot.user.username);
	updatePresence();

	console.log(Date.now().toString());

	for (let guild of bot.guilds) {
		setUpServer(guild[1]);
	}

	loadWaterTimers();
	debugLog(waterTimers);
	debugLog(runningTimers);
	startAllWaterTimers();
	debugLog(runningTimers);

	debugLog(Storage);
	saveVars();

});

// MESSAGE
bot.on('message', msg => {
	if (checkMessageForCommand(msg)) {
		if (msg.channel.type !== 'dm' && msg.channel.type !== 'group') {
			setTimeout(function() {
				msg.delete().then(debugLog, console.error);
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
		if (msg.isMentioned(bot.user)) {
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
bot.on('guildCreate', guild => {
	console.log('Joined server \'' + guild.name + '\'.');
	setUpServer(guild);
});

// REMOVED FROM SERVER
bot.on('guildDelete', guild => {
	console.log('Whoa whoa whoa I just got kicked from ' + guild.name);
});

//// METHODS

function getTimeZone(user) {
	return Storage.users[user.id].timeZone;
}

function loadWaterTimers() {
	for (let user in Storage.users) {
		if (Storage.users.hasOwnProperty(user)) {
			if (Storage.users[user].hasOwnProperty('water')) {
				if (Storage.users[user].water.enabled === true) {
					addWaterTimer(user, Storage.users[user].water.interval);
				}
			}
		}
	}
}

function addWaterTimer(user, interval) {
	waterTimers[user] = interval;
}

function startAllWaterTimers() {
	for (let user in waterTimers) {
		if (waterTimers.hasOwnProperty(user)) {
			startWaterTimer(user);
		}
	}
}

function startWaterTimer(user) {
	let now = (new Date()).getTime();
	debugLog('[startWaterTimer]: ' + waterTimers[user]);
	debugLog(waterTimers);
	let curTimer = setInterval(function() {
		sendWater(user);
	}, waterTimers[user] * 60000);
	if (runningTimers[user] == null) {
		runningTimers[user] = {};
	}
	runningTimers[user].timer = curTimer;
	runningTimers[user].started = now;
}

function stopWaterTimer(user) {
	if (runningTimers[user] == null) {
		return false;
	}
	clearInterval(runningTimers[user].timer);
	runningTimers[user] = null;
}

function updateWaterTimer(user) {
	stopWaterTimer(user);
	waterTimers[user] = Storage.users[user].water.interval;
	startWaterTimer(user);
}

function getWaterTimerStatus(user) {
	let now = (new Date()).getTime();
	return (runningTimers[user].started + waterTimers[user] * 1000) - now;
}

async function sendDM(user, message) {
	let cur = bot.users.get(user);
	let channel = await cur.createDM();
	channel.send(message)
		.then(debugLog, console.error);
}

function sendWater(user) {
	let actualUser = bot.users.get(user);
	runningTimers[user].started = (new Date()).getTime();
	if (actualUser.presence.status === 'offline' || actualUser.presence.status === 'dnd') {
		return false;
	}
	let embed = new Discord.RichEmbed()
		.setTitle('Stay hydrated!')
		.setDescription('Drink some water **now**.')
		.setThumbnail('https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192');
	return sendDM(user, {embed});
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

function setUpServer(server) {
	if (!Storage.servers.hasOwnProperty(server.id)) {
		console.log('Added \'' + server.name + '\' to server list.');
		Storage.servers[server.id] = {};
	}
	Storage.servers[server.id].channels = Storage.servers[server.id].channels || {};
	Storage.servers[server.id].disabledFeatures = Storage.servers[server.id].disabledFeatures || {};
}

function setUpUser(user) {
	if (!Storage.users.hasOwnProperty(user.id)) {
		console.log('Added \'' + user + '\' to user list.');
		Storage.users[user.id] = {};
	}
	Storage.users[user.id].wednesday = Storage.users[user.id].wednesday || {};
	Storage.users[user.id].water = Storage.users[user.id].water || {};
	Storage.users[user.id].timeZone = Storage.users[user.id].timeZone || '+0100';
}

function saveVars() {
	fs.writeFileSync('./vars.json', JSON.stringify(Storage, null, 2));
}

function sendWednesday(channelID) {
	let embed = new Discord.RichEmbed()
		.setTitle('It is Wednesday, my dudes.')
		.setColor(0x00AE86)
		.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
	bot.channels.get(channelID).send({embed});
}

function updatePresence(status, name, type, url) {
	status = status || 'available';
	name = name || Storage.prefix + 'help';
	type = type || 'LISTENING';
	url = url || 'https://www.github.com/Kaeks/abuse-bot';
	bot.user.setStatus(status)
		.then(debugLog, console.error);
	bot.user.setPresence({
		game: {
			name: name,
			type: type,
			url: url
		}
	}).then(debugLog, console.error);
}

function getPartialHelp(cmd) {
	let temp = '';
	let usage = commands[cmd].usage;
	let description = commands[cmd].description;

	for (let i = 0; i < usage.length; i++) {
		temp += '`' + Storage.prefix + cmd + ' ' + usage[i] + '`';
		if (description[i]) {
			temp += '\n-- ' + description[i];
		}
		temp += '\n';
	}
	return temp;
}

function getHelpEmbed(cmd) {
	let embed = new Discord.RichEmbed().setColor(0x00AE86);

	if (cmd !== undefined) {
		embed = embed.setTitle('Help for ' + Storage.prefix + cmd)
			.setDescription(getPartialHelp(cmd));
	} else {
		embed = embed.setTitle('Available Commands');
		for (let command in commands) {
			embed = embed.addField(Storage.prefix + command, getPartialHelp(command));
		}
	}
	return {embed};
}

function checkMessageForCommand(msg) {
	// Check whether the message was issued by another user
	if (msg.author.id === bot.user.id) return false;
	if (!msg.content.startsWith(Storage.prefix)) return false;
	if (!Storage.users.hasOwnProperty(msg.author.id)) setUpUser(msg.author);

	// Filter out blocked users
	for (let i = 0; i < Blocked.users.length; i++) {
		if (msg.author.id === Blocked.users[i]) {
			console.log('User is on blocked user list');
			msg.channel.send('I\'m sorry, ' + msg.author + ', you\'ve been blocked from using me.');
			return false;
		}
	}

	const commandName = msg.content.slice(Storage.prefix.length).split(' ')[0].toLowerCase();
	debugLog('commandName: ' + commandName);
	const suffix = msg.content.substring(commandName.length + Storage.prefix.length + 1);
	debugLog('suffix: ' + suffix);

	if (!bot.commands.has(commandName)) return false;

	const command = bot.commands.get(commandName);

	if (command.args && !suffix.length) {
		msg.channel.send('Too few arguments.');
		return false;
	}

	try {
		command.execute(msg, suffix);
		return true;
	} catch (e) {
		console.log(e.stack);
		let msgText = 'Internal Error. Command `' + commandName + '` failed.';
		msg.channel.send(msgText).then(debugLog, console.error);
	}
}

function debugLog(msg) {
	if (Storage.debug) {
		console.log(msg);
	}
}

bot.login(token)
	.then(debugLog, console.error);
