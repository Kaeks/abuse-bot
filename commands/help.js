const common = require('../common.js');
const { Config } = common;
const Discord = require('discord.js');

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
	async execute(msg, suffix) {
		const { commands } = msg.client;

		let embed = new Discord.RichEmbed().setColor(0x00AE86);

		if (suffix == null) {
			embed.setTitle('Help for all commands');
			common.getFullHelpEmbed(msg, embed);
			let user = msg.author;
			let channel = await common.getDmChannel(user);
			channel.send({ embed: embed });
		} else {
			const commandName = suffix.split(' ')[0].toLowerCase();
			common.debug('commandName: ' + commandName);
			if (!commands.has(commandName)) return false;
			const command = commands.get(commandName);
			embed.setTitle('Help for ' + Config.prefix + commandName)
				.setDescription(common.getCommandHelp(command));
			msg.channel.send({ embed: embed });
		}
	}
};