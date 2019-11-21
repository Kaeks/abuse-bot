const common = require('../common');
const { Discord, Config } = common;
const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');

module.exports = {
	name : 'help',
	args : argumentValues.OPTIONAL,
	usage : [
		'',
		'[command]'
	],
		description : [
		'Show help for all commands.',
		'Show help for <command>'
	],
	async execute(msg, suffix) {
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
	}
};