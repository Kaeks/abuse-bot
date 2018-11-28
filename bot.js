const Discord = require('discord.js');
const auth = require('./auth.json');
const token = auth.token;
const bot = new Discord.Client();
const fs = require('fs');
var Storage = {};
try {
	Storage = require("./vars.json");
	debugLog("Read vars.json");
} catch (e) {
	fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
}

if (!Storage.hasOwnProperty("prefix")) {
	Storage.prefix = "!";
}

if (!Storage.hasOwnProperty("amt")) {
	Storage.amt = 0;
}

if (!Storage.hasOwnProperty("debug")) {
	Storage.debug = true;
}

if (!Storage.hasOwnProperty("servers")) {
	Storage.servers = {};
}

for (let server in Storage.servers) {
	if (!Storage.servers[server].hasOwnProperty("channels")) {
		Storage.servers[server].channels = {};
	}
	if (!Storage.servers[server].hasOwnProperty("disabledFeatures")) {
		Storage.servers[server].disabledFeatures = {};
	}
}

fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));

var amt = Storage.amt;


bot.on('ready', () => {
	console.log("*hacker voice* I'm in.");
	console.log(bot.user.username);
	updatePresence();

	for (let guild of bot.guilds) {
		let id = guild[1].id;
		console.log(id);
		console.log(Storage.servers.hasOwnProperty(id));
		if (!Storage.servers.hasOwnProperty(id)) {
			console.log("doing it");
			Storage["servers"][id] = {};
		}
	}
	console.log(Storage);
	fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));

});

bot.on('message', msg => {
	if (msg.isMentioned(bot.user)) {
		msg.channel.send("wassup " + msg.author);
	}

	if (checkMessageForCommand(msg)) {
		if (msg.channel.type != "dm" && msg.channel.type != "group") {
			setTimeout(function() {
				msg.delete();
			}, 3000);
		}
	}

});

var commands = {
	"abuse": {
		usage: [
			"",
			"check"
		],
		description: [
			"Add to the abuse counter.",
			"Display amount of abuses."
		],
		process: function(bot, msg, suffix) {
			if (suffix != "check") {
				amt++;
				Storage.amt = amt;
				fs.writeFile("./vars.json", JSON.stringify(Storage, null, 2), function (err) {
					if (err) {
						return console.log(err);
					}
				});
			}
			let string = "Spark people have abused each other " + amt + " time";
			if (amt == 0 || amt > 1) {
				string += "s";
			}
			string += ".";
			msg.channel.send(string);
		}
	},
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
					fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
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
						fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
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
				.setFooter(msg.author.username + " pays his respects.");
			msg.channel.send({embed});
		}
	}
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
	if (msg.author.id != bot.user.id && msg.content.startsWith(Storage.prefix)) {
		console.log("'" + msg.content + "' by " + msg.author + " is command");
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
		//message is not a command or from the bot itself
		return false;
	}
}

function debugLog(msg) {
	if (Storage.debug) {
		console.log(msg);
	}
}

bot.login(token);
