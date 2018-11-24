const Discord = require('discord.js');
const auth = require('./auth.json');
const token = auth.token;
const bot = new Discord.Client();
const fs = require('fs');
var storage = require('./vars.json');
var amt = storage.amt; 


bot.on('ready', () => {
	console.log("I'm in.");
	console.log(bot.user.username);
});

bot.on('message', msg => {
	//Checks if message starts with '!'
	if (msg.content.charAt(0) == '!') {
		let string = "";
		switch(msg.content.substring(1)) {
			case "abuse":
			amt++;
			storage.amt = amt;
			fs.writeFile("./vars.json", JSON.stringify(storage, null, 2), function (err) {
				if (err) {
					return console.log(err);
				}
			});
			string = "Spark people have abused each other " + amt + " time";
			if (amt == 0 || amt > 1) {
				string += "s";
			}
			string += ".";
			msg.channel.send(string);
			break;
			
			case "abuseCheck":
			string = "Spark people have abused each other " + amt + " time";
			if (amt == 0 || amt > 1) {
				string += "s";
			}
			string += ".";
			msg.channel.send(string);
			break;
		}
	}
});

bot.login(token);