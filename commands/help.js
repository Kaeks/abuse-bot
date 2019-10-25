const common = require('../common.js');
const Discord = require('discord.js');
const { prefix } = require('../config.json');
module.exports = {
	name: 'help',
	usage: [
		'',
		'<command>'
	],
		description: [
		'Show help for all commands.',
		'Show help for <command>'
	],
	execute(msg, args) {
		const { commands } = msg.client;

		if (!args.length) {
			console.log(commands);
		} else {
			const commandName = args.split(' ')[0].toLowerCase();
			common.debugLog('commandName: ' + commandName);
			if (!commands.has(commandName)) return false;
			const command = commands.get(commandName);
			logCommand(command);
		}

		/*
		let embed = new Discord.RichEmbed().setColor(0x00AE86);

		if (!args.length) {
			embed = embed.setTitle('Available Commands');
			for (let command in commands) {
				if (!commands.hasOwnProperty(command)) continue;
				let commandName = command.name;
				embed = embed.addField(prefix + commandName, getPartialHelp(command));
			}

		} else {
			embed = embed.setTitle('Help for ' + prefix + cmd)
				.setDescription(getPartialHelp(cmd));
		}*/
	}
};

function logCommand(command, commandChain) {
	commandChain = commandChain || [];
	commandChain.push(command);
	for (let property in command) {
		if (!command.hasOwnProperty(property)) continue;
		if (property === 'sub') {
			let subs = command[property];
			for (let sub in subs) {
				if (!subs.hasOwnProperty(sub)) continue;
				logCommand(subs[sub]);
			}
		} else {
			console.log(property + ': ' + command[property]);
		}
	}
}

function getPartialHelp() {
	let temp = '';
	let usage = commands[cmd].usage;
	let description = commands[cmd].description;

	for (let i = 0; i < usage.length; i++) {
		temp += '`' + prefix + cmd + ' ' + usage[i] + '`';
		if (description[i]) {
			temp += '\n-- ' + description[i];
		}
		temp += '\n';
	}
	return temp;
}