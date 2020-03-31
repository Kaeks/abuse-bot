const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');
const { argumentValues, colors } = enums;

let commandHelp = new Command('help', argumentValues.OPTIONAL)
	.addDoc('', 'Show help for all commands.')
	.addDoc('[command]', 'Show help for [command].')
	.setExecute(async (msg, suffix) => {
		let client = msg.client;
		const commands = client.commands;

		let embed = new Discord.RichEmbed().setColor(colors.GREEN);

		if (suffix == null) {
			embed.setTitle('Help for all commands');
			client.getFullHelpEmbed(msg, embed);
			let user = msg.author;
			let channel = await user.getDmChannel();
			channel.send({ embed: embed });
		} else {
			const commandName = suffix.split(' ')[0].toLowerCase();
			client.logger.debug('Command help: ' + commandName);
			if (!commands.has(commandName)) return false;
			const command = commands.get(commandName);
			embed.setTitle('Help for ' + client.config.prefix + commandName)
				.setDescription(client.getCommandHelp(command));
			msg.channel.send({ embed: embed });
		}
	});

module.exports = commandHelp;
