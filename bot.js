const Discord = require('discord.js');
const auth = require('./auth.json');
const token = auth.token;
const bot = new Discord.Client();
const fs = require('fs');
const CronJob = require('cron').CronJob;
var waterTimers = {};
var runningTimers = {};
require('datejs');

var Storage = {};
try {
	Storage = require("./vars.json");
	debugLog("Read vars.json");
} catch (e) {
	saveVars();
}

var Blocked = {};
try {
	Blocked = require("./blocked_users.json");
	debugLog("Read blocked_users.json");
} catch (e) {
	fs.writeFileSync("./blocked_users.json", JSON.stringify(Blocked, null, 2));
}

if (!Blocked.hasOwnProperty("users")) {
	Blocked.users = [];
}

if (!Storage.hasOwnProperty("prefix")) {
	Storage.prefix = "!";
}

if (!Storage.hasOwnProperty("debug")) {
	Storage.debug = true;
}

if (!Storage.hasOwnProperty("servers")) {
	Storage.servers = {};
}

if (!Storage.hasOwnProperty("users")) {
	Storage.users = {};
}

if (!Storage.hasOwnProperty("reminders")) {
	Storage.reminders = [];
}

for (let server in Storage.servers) {
	if (!Storage.servers[server].hasOwnProperty("channels")) {
		Storage.servers[server].channels = {};
	}
	if (!Storage.servers[server].hasOwnProperty("disabledFeatures")) {
		Storage.servers[server].disabledFeatures = {};
	}
}

saveVars();
fs.writeFileSync("./blocked_users.json", JSON.stringify(Blocked, null, 2));

new CronJob("0 0 * * 3", async function() {
	for (let server in Storage.servers) {
		if (Storage.servers[server].channels.hasOwnProperty("wednesday")) {
			if (Storage.servers[server].disabledFeatures.wednesday == false || Storage.servers[server].disabledFeatures.wednesday == undefined) {
				let channel = Storage.servers[server].channels.wednesday;
				sendWednesday(channel);
			}
		}
	}
	for (let user in Storage.users) {
		if (Storage.users[user].hasOwnProperty("wednesday")) {
			if (Storage.users[user].wednesday == true) {
				let cur = bot.users.get(user);
				let channel = await cur.createDM();
				sendWednesday(channel.id);
			}
		}
	}
}, null, true, "Europe/Berlin");

/* Events */

//Start
bot.on('ready', () => {
	console.log("*hacker voice* I'm in.");
	console.log(bot.user.username);
	updatePresence();

	console.log(Date.now().toString());

	for (let guild of bot.guilds) {
		setUpServer(guild[1]);
	}

	loadWaterTimers();
	console.log(waterTimers);
	console.log(runningTimers);
	startAllWaterTimers();
	console.log(runningTimers);

	console.log(Storage);
	saveVars();

});

//Message
bot.on('message', msg => {
	if (checkMessageForCommand(msg)) {
		/*if (msg.channel.type != "dm" && msg.channel.type != "group") {
			setTimeout(function() {
				msg.delete();
			}, 3000);
		}*/
		return;
	}
	if (msg.content.match(/(eat.*ass)/i)) {
		msg.channel.send("Hey " + msg.author + ", that's not very nice of you!");
		return;
	}
	if (msg.isMentioned(bot.user)) {
		msg.channel.send("wassup " + msg.author);
		return;
	}

});

//Join Server
bot.on('guildCreate', guild => {
	console.log("Joined server '" + guild.name + "'.");
	setUpServer(guild);
});

//Leave Server
bot.on('guildDelete', guild => {
	console.log("Whoa whoa whoa I just got kicked from " + guild.name);
});

/* Commands */

var commands = {
	"wiktor": {
		usage: "",
		description: "Brings Wiktor back.",
		process: function(bot, msg, suffix) {
			msg.channel.send("Nyeh heh heh I'm back.");
		}
	},
	"sperm": {
		usage: "<user>",
		description: "Spam <user>'s DMs.",
		process: function(bot, msg, suffix) {
			console.log(msg.mentions);
			for (let i = 0; i < 5; i++) {
				msg.mentions.users.first().send("sperm");
			}
			msg.mentions.users.first().send("spermed by " + msg.author);
		}
	},
	"reminder": {
		usage: [
			"add <time/date> [-m <message>]",
			"remove <#/all>",
			"list"
		],
		description: [
			"Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].",
			"Remove the reminder with list #<#> or remove <all> reminders.",
			"List all reminders"
		],
		process: function(bot, msg, suffix) {
			if (suffix == "") {
				msg.channel.send(displayHelp("reminder"));
			}
			if (suffix.split(" ")[0] == "add") {
				let regexString = suffix.match(/(?:add) (.*)(?:-m (.*))/i);
				console.log(regexString);
				let date = Date.parse(regexString[1]);
				let task = regexString[2];
				if (date != null) {
					let msgLink = "http://discordapp.com/channels/" + ((msg.channel.type === "text") ? msg.guild.id : "@me") + "/" + msg.channel.id + "/" + msg.id;
					Storage.reminders.push({
						"user" : msg.author.id,
						"date" : date,
						"msgLink" : msgLink,
						"task" : task
					});
					console.log(Storage.reminders);
					saveVars();
					let embed = new Discord.RichEmbed()
						.setTitle("Reminder set!")
						.setDescription("I will remind you about [this message](<" + msgLink + ">) on " + date + ".")
						.setFooter("I actually won't because my owner is too lazy to implement that right now.");
					msg.channel.send({embed});
				} else {
					console.log("Date parser failed!");
				}
			}
			if (suffix.split(" ")[0] == "remove") {
				let toRemove = suffix.split(" ")[1];
				if (toRemove == "all") {
					for (let i = 0; i < Storage.reminders.length; i++) {
						if (Storage.reminders[i].user == msg.author.id) {
							Storage.reminders[i] = null;
						}
					}
					saveVars();
				}
			}
			if (suffix.split(" ")[0] == "list") {
				let tempReminders = [];
				for (let i = 0; i < Storage.reminders.length; i++) {
					if (Storage.reminders[i].user == msg.author.id) {
						tempReminders.push(Storage.reminders[i]);
					}
				}
				let tempText = "";
				for (let i = 0; i < tempReminders.length; i++) {
					let cur = tempReminders[i];
					tempText += "**#" + (i+1) + "** " + unparseDate(cur.date);
					if (cur.task != null) {
						tempText += " - " + cur.task;
					}
					if (i < tempReminders.length) {
						tempText += "\n";
					}
				}
				let embed = new Discord.RichEmbed()
					.setDescription("Here are your reminders, " + msg.author + "!\n" + tempText)
				msg.channel.send({embed});
			}
		}
	},
	"wednesday": {
		usage: [
			"",
			"enable/disable",
			"channel",
			"channel set [textChannel]",
			"subscribe/unsubscribe",
			"test"
		],
		description: [
			"It is Wednesday, my dudes.",
			"Enable/disable Wednesday posting.",
			"View channel for Wednesdays.",
			"Set channel for Wednesdays.",
			"Subscribe/unsubscribe from the private Wednesday service.",
			"Simulate a Wednesday."
		],
		process: function(bot, msg, suffix) {
			let args = suffix.split(" ");
			if (args[0] == "") {
				let embed = new Discord.RichEmbed()
					.setTitle("It is Wednesday, my dudes.")
					.setColor(0x00AE86)
					.setImage("https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg");
				msg.channel.send({embed});
				return;
			}
			let server;
			if (args[0] == "enable" || args[0] == "disable" || args[0] == "channel") {
				if (msg.channel.type == "dm" || msg.channel.type == "group") {
					msg.channel.send("Cannot be used in (group) DMs.").then((message => message.delete(5000)));
					return;
				}
			}
			let author = msg.author.id;
			if (args[0] == "channel") {
				server = msg.guild.id;
				if (args[1] == "set") {
					let channel;
					if (args[2]) {
						channel = msg.mentions.channels.first();
					} else {
						channel = msg.channel;
					}
					if (!Storage["servers"][server].hasOwnProperty("channels")) {
						Storage["servers"][server]["channels"] = {};
					}
					Storage["servers"][server]["channels"]["wednesday"] = channel.id;
					msg.channel.send("Channel for Wednesdays has been set to " + channel);
					saveVars();
				} else {
					let channelID = Storage["servers"][server]["channels"]["wednesday"];
					let channel = bot.channels.get(channelID);
					msg.channel.send("Channel for Wednesdays is " + channel);
				}
			}
			if (args[0] == "enable") {
				server = msg.guild.id;
				Storage.servers[server].disabledFeatures.wednesday = false;
				msg.channel.send("Wednesdaily frog has been enabled. :frog:");
				saveVars();
			}
			if (args[0] == "disable") {
				server = msg.guild.id;
				Storage.servers[server].disabledFeatures.wednesday = true;
				msg.channel.send("Wednesdaily frog has been disabled. <:tairaOOF:455716045987250186>");
				saveVars();
			}
			if (args[0] == "subscribe" || args[0] == "unsubscribe") {
				if (!Storage.users.hasOwnProperty(author)) {
					Storage.users[author] = {};
					saveVars();
				}
			}
			if (args[0] == "subscribe") {
				if (Storage.users[author].wednesday == true) {
					msg.channel.send("You are already subscribed to the private Wednesday service.");
				} else {
					Storage.users[author].wednesday = true;
					msg.channel.send("You are now subscribed to the private Wednesday service.");
					saveVars();
				}
			}
			if (args[0] == "unsubscribe") {
				if (Storage.users[author].wednesday == true) {
					Storage.users[author].wednesday = false;
					msg.channel.send("You are no longer subscribed to the private Wednesday service.");
					saveVars();
				} else {
					msg.channel.send("You are not subscribed to the private Wednesday service.");
				}
			}
			if (args[0] == "test") {
				if (msg.channel.type == "dm" || msg.channel.type == "group") {
					if (Storage.users[author].wednesday == true) {
						sendWednesday(bot.users.get(author).dmChannel.id);
					} else {
						msg.channel.send("You need to subscribe to the Wednesday frog service first.");
					}
				}
				if (msg.channel.type == "text") {
					server = msg.guild.id;
					if (Storage.servers[server].channels.hasOwnProperty("wednesday")) {
						if (Storage.servers[server].disabledFeatures.wednesday == false || Storage.servers[server].disabledFeatures.wednesday == undefined) {
							let channelID = Storage.servers[server].channels.wednesday;
							sendWednesday(channelID);
						} else {
							msg.channel.send("This server has disabled the Wednesday frog service.");
						}
					} else {
						msg.channel.send("This server doesn't have a channel for the Wednesday frog to be sent to.");
					}
				}
			}
		}
	},
	"water": {
		usage: [
			"status",
			"join",
			"leave",
			"interval [set <minutes>]"
		],
		description: [
			"Display your current water status.",
			"Join the water club.",
			"Leave the water club.",
			"Display your current interval or set a new interval."
		],
		process: function(bot, msg, suffix) {
			if (suffix == "") {
				msg.channel.send(displayHelp("water"));
			}
			let args = suffix.split(" ");
			let user = msg.author;
			switch(args[0]) {
				case "status":
				//Catch users not in the water club
				if (typeof Storage.users[user.id] == "undefined" || typeof Storage.users[user.id].water == "undefined" || typeof Storage.users[user.id].water.enabled == "undefined" || Storage.users[user.id].water.enabled != true) {
					msg.channel.send("Wait, that's illegal. You are not a member of the water club.");
					break;
				}
				//Alright, they're out!
				let seconds = Math.floor(getWaterTimerStatus(user.id) / 1000);
				let minutes = Math.floor(seconds / 60);
				let newSeconds = seconds - minutes * 60;
				let string = minutes + " minutes, " + newSeconds + " seconds";
				msg.channel.send("Your next reminder will be issued in " + string + ".");
				break;

				case "join":
				const WATER_INTERVAL = 60;
				if (typeof Storage.users[user.id] == "undefined") {
					Storage.users[user.id] = {};
				}
				if (typeof Storage.users[user.id].water == "undefined") {
					Storage.users[user.id].water = {};
				}
				console.log(Storage.users);
				if (Storage.users[user.id].water.enabled == true) {
					msg.channel.send("You are already a member of the water club!");
					break;
				}
				console.log(Storage.users);
				Storage.users[user.id].water.enabled = true;
				Storage.users[user.id].water.interval = WATER_INTERVAL;
				console.log(Storage.users);
				fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
				console.log(Storage.users);
				msg.channel.send("Welcome to the water club, " + msg.author + "!\nYou will be notified every " + WATER_INTERVAL + " minutes (default value).");
				addWaterTimer(user.id);
				startWaterTimer(user.id);
				break;

				case "leave":
				if (typeof Storage.users[user.id] == "undefined" || typeof Storage.users[user.id].water == "undefined" || typeof Storage.users[user.id].water.enabled == "undefined" || Storage.users[user.id].water.enabled != true) {
					msg.channel.send("Can't leave a club you are not a member of :^)");
					break;
				}
				Storage.users[user.id].water.enabled = false;
				saveVars()
				msg.channel.send("You have left the water club. Sad to see you go! :(");
				break;

				case "interval":
				//Catch users not in the water club
				if (typeof Storage.users[user.id] == "undefined" || typeof Storage.users[user.id].water == "undefined" || typeof Storage.users[user.id].water.enabled == "undefined" || Storage.users[user.id].water.enabled != true) {
					msg.channel.send("Wait, that's illegal. You are not a member of the water club.");
					break;
				}
				//Alright, they're out!
				if (args[1] == null) {
					let userInterval = Storage.users[user.id].water.interval;
					msg.channel.send("Your interval is set to " + userInterval + " minutes.");
					break;
				}
				if (args[1] == "set") {
					if (args[2] != null) {
						let newIntervalString = args[2];
						if (!isNaN(newIntervalString)) {
							if (parseInt(newIntervalString, 10) > 0 ) {
								let newInterval = parseInt(newIntervalString, 10);
								Storage.users[user.id].water.interval = newInterval;
								saveVars();
								msg.channel.send("Water interval has been set to " + newInterval + " minutes.");
								console.log(waterTimers);
								console.log(runningTimers);
								updateWaterTimer(user.id);
								console.log(waterTimers);
								console.log(runningTimers);
							} else {
								msg.channel.send("<interval> must be above 0.");
							}
						} else {
							msg.channel.send("<interval> must be an integer.");
						}
					} else {
						msg.channel.send("Usage: `" + Storage.prefix + "water set <interval in minutes>`");
					}
				}
				break;
			}
		}
	},
	"config": {
		usage: [
			"prefix",
			"prefix <newPrefix>",
			"debug",
			"debug <true|false>"
		],
		description: [
			"View prefix",
			"Set new prefix",
			"View debug logging",
			"Enable/disable debug logging"
		],
		process: function(bot, msg, suffix) {
			if (suffix == "") {
				msg.channel.send(displayHelp("config"));
			}
			let args = suffix.split(" ");
			if (args[0] == "prefix") {
				if (args.length == 1) {
					msg.channel.send("Bot prefix is currently `" + Storage.prefix + "`.");
				} else {
					let newPrefix = suffix.substring("prefix ".length);
					Storage.prefix = newPrefix;
					msg.channel.send("Bot prefix has been set to `" + newPrefix + "`.");
					saveVars();
					updatePresence();
				}

			} else if (args[0] == "debug") {
				if (args.length == 1) {
					msg.channel.send("`debug` is set to `" + Storage.debug + "`.");
				} else {
					let newValue;
					if (args[1] == "true") {
						newValue = true;
					} else if (args[1] == "false") {
						newValue = false;
					}
					if (typeof newValue != "undefined") {
						Storage.debug = args[1];
						msg.channel.send("`debug` has been set to `" + args[1] + "`.");
						saveVars();
					} else {
						msg.channel.send("Excuse me, what the frick?").then((message => message.delete(5000)));
					}
				}
			}
		}
	},
	"embedtest": {
		process: function(bot, msg, suffix) {
			let embed = new Discord.RichEmbed()
				.setTitle("Title")
				.setAuthor("Author", "https://cdn.discordapp.com/attachments/269556649952280576/516366500576362502/Z.png")
				.setColor(0x00AE86)
				.setDescription("Main Text 2048char")
				.setFooter("Footer 2048char", "https://cdn.discordapp.com/attachments/269556649952280576/516366500576362502/Z.png")
				.setImage("https://cdn.discordapp.com/attachments/269556649952280576/516366500576362502/Z.png")
				.setThumbnail("https://cdn.discordapp.com/attachments/269556649952280576/516366500576362502/Z.png")
				.addField("Field Title 256char", "Field Value 2048char")
				.addField("Inline Field 256char", "Inline Field Value 2048char", true)
				.addBlankField(true)
				.addField("Max of 25 Fields", "hi", true);
			msg.channel.send({embed});
		}
	},
	"f": {
		usage: "",
		description: "Pay respects.",
		process: function(bot, msg, suffix) {
			let embed = new Discord.RichEmbed()
				.setColor(0x00AE86)
				.setAuthor(msg.author.username, msg.author.displayAvatarURL)
				.setImage("https://cdn.discordapp.com/attachments/269556649952280576/517073107891126292/image0.jpg")
				.setFooter(msg.author.username + " pays their respects.");
			msg.channel.send({embed});
		}
	}
}

function loadWaterTimers() {
	for (let user in Storage.users) {
		if (Storage.users[user].hasOwnProperty("water")) {
			if (Storage.users[user].water.enabled == true) {
				addWaterTimer(user, Storage.users[user].water.interval);
			}
		}
	}
}

function addWaterTimer(user, interval) {
	waterTimers[user] = interval;
}

function startAllWaterTimers() {
	for (let user in waterTimers) {
		startWaterTimer(user);
	}
}

function startWaterTimer(user) {
	let now = (new Date()).getTime();
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
}

function updateWaterTimer(user) {
	stopWaterTimer(user);
	waterTimers[user] = Storage.users[user].water.interval;
	startWaterTimer(user);
}

function getWaterTimerStatus(user) {
	let now = (new Date()).getTime();
	let diff = (runningTimers[user].started + waterTimers[user] * 1000) - now;
	return diff;
}

async function sendDM(user, message) {
	let cur = bot.users.get(user);
	let channel = await cur.createDM();
	channel.send(message);
}

function sendWater(user) {
	let actualUser = bot.users.get(user);
	if (actualUser.presence.status == "offline" || actualUser.presence.status == "dnd") {
		return;
	}
	let embed = new Discord.RichEmbed()
		.setTitle("Stay hydrated!")
		.setDescription("Drink some water **now**.")
		.setThumbnail("https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192");
	sendDM(user, {embed});
}

function unparseDate(date) {
	if (Date.compare(Date.parse(date), (1).day().fromNow()) == 1) {
		if (Date.compare(Date.parse(date), (1).year().fromNow()) == 1) {
			dateString = Date.parse(date).toString("MMM dS, yyyy HH:mm");
		} else {
			dateString = Date.parse(date).toString("MMM dS HH:mm");
		}
	} else {
		dateString = Date.parse(date).toString("HH:mm");
	}
	return dateString;
}

function setUpServer(server) {
	if (!Storage.servers.hasOwnProperty(server.id)) {
		console.log("Added '" + server.name + "' to server list.");
		Storage.servers[server.id] = {};
	}
	if (!Storage.servers[server.id].hasOwnProperty("channels")) {
		console.log("Added channels property.");
		Storage.servers[server.id].channels = {};
	}
	if (!Storage.servers[server.id].hasOwnProperty("disabledFeatures")) {
		console.log("Added disabledFeatures property.");
		Storage.servers[server.id].disabledFeatures = {};
	}
}

function saveVars() {
	fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
}

function sendWednesday(channelID) {
	let embed = new Discord.RichEmbed()
		.setTitle("It is Wednesday, my dudes.")
		.setColor(0x00AE86)
		.setImage("https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg");
	bot.channels.get(channelID).send({embed});
}

function updatePresence(status, name, type, url) {
	status = status || "available";
	name = name || Storage.prefix + "help";
	type = type || "LISTENING";
	url = url || "https://www.github.com/Kaeks/abuse-bot";
	bot.user.setStatus(status);
	bot.user.setPresence({
		game: {
			name: name,
			type: type,
			url: url
		}
	});
}

function displayHelp(cmd) {
	let embed = new Discord.RichEmbed()
		.setTitle("Help for " + Storage.prefix + cmd)
		.setColor(0x00AE86);

	let usage = commands[cmd].usage;
	let description = commands[cmd].description;
	let temp = "";
	if (usage instanceof Object && description instanceof Object) {
		for (let i = 0; i < usage.length; i++) {
			temp += "`" + Storage.prefix + cmd + " " + usage[i] + "`";
			if (description[i]) {
				temp += "\n-- " + description[i];
			}
			temp += "\n";
		}
	} else {
		temp += "`" + Storage.prefix + cmd;
		if (usage) {
			temp += " " + usage;
		}
		temp += "`";
		if (description) {
			temp += "\n-- " + description;
		}
	}
	embed = embed.setDescription(temp);
	return {embed};
}

function checkMessageForCommand(msg) {
	if (msg.author.id != bot.user.id) {
		if (msg.content.startsWith(Storage.prefix)) {
			console.log("'" + msg.content + "' by " + msg.author + " is command");
			for (let i = 0; i < Blocked.users.length; i++) {
				if (msg.author.id == Blocked.users[i]) {
					console.log("User is on blocked user list");
					msg.channel.send("Oof, you've been blocked from using me.");
					return false;
				}
			}
			let cmdText = msg.content.split(" ")[0].substring(Storage.prefix.length);
			debugLog("cmdText: " + cmdText);
			let suffix = msg.content.substring(cmdText.length + Storage.prefix.length + 1);
			debugLog("suffix: " + suffix);

			let cmd = commands[cmdText];

			if (cmdText == "help") {
				//command is help
				if (suffix) {
					let helpCmd = suffix.split(" ").filter(function(thing) {
						return commands[thing];
					});
					let info = displayHelp(helpCmd);
					msg.channel.send(info);
				} else {
					let embed = new Discord.RichEmbed()
						.setTitle("Available Commands")
						.setColor(0x00AE86);

					for (let cmd in commands) {
						let usage = commands[cmd].usage;
						let description = commands[cmd].description;
						if (usage instanceof Object && description instanceof Object) {
							let temp = "";
							for (let i = 0; i < usage.length; i++) {
								temp += "`" + Storage.prefix + cmd + " " + usage[i] + "`";
								if (description[i]) {
									temp += "\n-- " + description[i];
								}
								temp+= "\n";
							}
							embed = embed.addField(Storage.prefix + cmd, temp);
						} else {
							let temp = "`" + Storage.prefix + cmd;
							if (usage) {
								console.log("usage yes");
								temp += " " + usage;
							}
							temp += "`";
							if (description) {
								console.log("desc yes");
								temp += "\n-- " + description;
							}
							temp+= " \n";
							embed = embed.addField(Storage.prefix + cmd, temp);
						}
					}
					msg.author.send({embed});
				}
				return true;
			} else if (cmd) {
				try {
					cmd.process(bot, msg, suffix);
				} catch (e) {
					console.log(e.stack);
					let msgText = "command " + cmdText + " failed. yikes.";
					msg.channel.send(msgText);
				}
				return true;
			} else {
				console.log(cmdText + " not recognized as a command!");
				//msg.channel.send(cmdText + " not recognized as a command!").then((message => message.delete(5000)));
				return true;
			}
		} else {
			//message is not a command
			return false;
		}
	}
	return false;
}

function debugLog(msg) {
	if (Storage.debug) {
		console.log(msg);
	}
}

bot.login(token);
