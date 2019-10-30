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

		let embed = new Discord.RichEmbed().setColor(0x00AE86);

		if (!args.length) {
			console.log(commands);
		} else {
			const commandName = args.split(' ')[0].toLowerCase();
			common.debugLog('commandName: ' + commandName);
			if (!commands.has(commandName)) return false;
			const command = commands.get(commandName);
			embed = embed.setTitle('Help for ' + prefix + commandName)
				.setDescription(logCommand(command));
		}
		msg.channel.send({embed});

		/*
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

function combineCommandChain(commandChain) {
	let commandString = '';
	for (let i = 0; i < commandChain.length; i++) {
		commandString += commandChain[i].name;
		if (i < commandChain.length - 1) commandString += ' ';
	}
	return commandString;
}

function logCommand(command, commandChain) {
	//TODO fix infinite chaining of commands in the chain between different commands of a list of subcommands
	console.log(commandChain);
	let localCommandChain = commandChain || [];
	console.log(localCommandChain);
	localCommandChain.push(command);
	let theEntireText = '';

	let commandString = combineCommandChain(localCommandChain);

	let hasUsage = command.hasOwnProperty('usage');
	let hasDesc = command.hasOwnProperty('description');

	let usageIsArray = hasUsage ? command.usage instanceof Array : undefined;
	let descIsArray = hasDesc ? command.usage instanceof Array : undefined;

	let usageIsString = hasUsage ? typeof command.usage === 'string' : undefined;
	let descIsString = hasDesc ? typeof command.usage === 'string' : undefined;

	if (hasUsage) {
		if (hasDesc) {
			if (usageIsString && descIsString) {
				theEntireText += `\` ${prefix + commandString} ${command.usage}\`\n-- ${command.description}\n`;
			} else if (usageIsArray && descIsArray) {
				if (command.usage.length === command.description.length) {
					for (let i = 0; i < command.usage.length; i++) {
						theEntireText += `\` ${prefix + commandString} ${command.usage[i]}\`\n-- ${command.description[i]}\n`;
					}
				} else common.warn(`Lengths of usage and description properties of command '${commandString}' do not match.`);
			} else common.warn(`Types of usage and description properties of command '${commandString}' do not match.`);
		} else {
			if (usageIsString) {
				theEntireText += `\` ${prefix + commandString} ${command.usage}\`\n`;
			} else if (usageIsArray) {
				for (let i = 0; i < command.usage.length; i++) {
					theEntireText += `\` ${prefix + commandString} ${command.usage[i]}\`\n`;
				}
			}
			common.info(`Command '${commandString}' has usage property, but no description property.`)
		}
	} else if (!(command.hasOwnProperty('args') && command.args)) common.info(`Command '${commandString}' doesn't have a usage property.`);

	if (command.hasOwnProperty('sub')) {
		let subs = command.sub;
		for (let sub in subs) {
			if (!subs.hasOwnProperty(sub)) continue;
			theEntireText += logCommand(subs[sub], localCommandChain);
		}
	}
	return theEntireText;
}