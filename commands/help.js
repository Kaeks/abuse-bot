const common = require('../common');
const { Discord, Config } = common;

const Command = require('../class/Command');

const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');

let commandHelp = new Command('help', argumentValues.OPTIONAL)
	.addDoc('', 'Show help for all commands.')
	.addDoc('[command]', 'Show help for [command].')
	.setExecute(async (msg, suffix) => {
		const { commands } = msg.client;

		let embed = new Discord.RichEmbed().setColor(colors.GREEN);

		if (suffix == null) {
			embed.setTitle('Help for all commands');
			common.getFullHelpEmbed(msg, embed);
			let user = msg.author;
			let channel = await user.getDmChannel();
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
	});

module.exports = commandHelp;
