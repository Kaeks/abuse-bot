const common = require('../common.js');
const Discord = require('discord.js');
const { prefix } = require('../config.json');

module.exports = {
	name : 'help',
	args : common.argumentValues.OPTIONAL,
	usage : [
		'',
		'<command>'
	],
		description : [
		'Show help for all commands.',
		'Show help for <command>'
	],
	execute(msg, suffix) {
		const { commands } = msg.client;

		let embed = new Discord.RichEmbed().setColor(0x00AE86);

		if (suffix.length === 0) {
			embed.setTitle('Help for all commands');
			common.getFullHelpEmbed(msg, embed);
			common.sendDM(msg.author.id,{embed});
		} else {
			const commandName = suffix.split(' ')[0].toLowerCase();
			common.debug('commandName: ' + commandName);
			if (!commands.has(commandName)) return false;
			const command = commands.get(commandName);
			embed.setTitle('Help for ' + prefix + commandName)
				.setDescription(common.getCommandHelp(command));
			msg.channel.send({embed});
		}
	}
};