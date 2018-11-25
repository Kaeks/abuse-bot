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

fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));

var amt = Storage.amt; 


bot.on('ready', () => {
	console.log("I'm in.");
	console.log(bot.user.username);
});

bot.on('message', msg => {
	if (msg.isMentioned(bot.user)) {
		msg.channel.send("wassup " + msg.author);
	}
	
	checkMessageForCommand(msg);
	
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
			switch (args[0]) {
				case "prefix":
				if (args.length == 1) {
					msg.channel.send("Bot prefix is currently `" + Storage.prefix + "`.");
				} else {
					let newPrefix = suffix.substring("prefix ".length);
					Storage.prefix = newPrefix;
					msg.channel.send("Bot prefix has been set to `" + newPrefix + "`.");
					fs.writeFileSync("./vars.json", JSON.stringify(Storage, null, 2));
				}
				break;
				
				case "debug":
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
					}
				}
				break;
			}
		}
	}
}

function displayHelp(cmd/*, sub*/) {
	debugLog("Display help of " + cmd);
	let info = "";
	let usage = commands[cmd].usage;
	debugLog(usage);
	let description = commands[cmd].description;
	debugLog(description);
	if (usage instanceof Object && description instanceof Object) {
		debugLog("usage is object of length " + usage.length);
		for (let i = 0; i < usage.length; i++) {
			info += "**" + Storage.prefix + cmd + "**";
			info += " " + usage[i];
			debugLog("usage[i] = " + usage[i]);
			if (description[i]) {
				info += "\n\t" + description[i];
				debugLog("description[i] = " + description[i]);
			}
			info += "\n";
		}
	} else {
		info += "**" + Storage.prefix + cmd + "**";
		if (usage) {
			info += " " + usage;
		}
		if (description) {
			info += "\n\t" + description;
		}
	}
	debugLog(info);
	return info;
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
				msg.author.send("**Available Commands:**").then(function() {
					let batch = "";
					for (let cmd in commands) {
						var info = "";
						let usage = commands[cmd].usage;
						let description = commands[cmd].description;
						if (usage instanceof Object && description instanceof Object) {
							for (let i = 0; i < usage.length; i++) {
								info += "**" + Storage.prefix + cmd + "**";
								info += " " + usage[i];
								if (description[i]) {
									info += "\n\t" + description[i];
								}
								info += "\n";
							}
						} else {
							info += "**" + Storage.prefix + cmd + "**";
							if (usage) {
								info += " " + usage;
							}
							if (description) {
								info += "\n\t" + description;
							}
							info += "\n";
						}
						
						let newBatch = batch + "\n" + info;
						if (newBatch.length > (1024 - 8)) {
							msg.author.send(batch);
							batch = info;
						} else {
							batch = newBatch;
						}
					}
					if (batch.length > 0) {
						msg.author.send(batch);
					}
				});
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
