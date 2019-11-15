const common = require('../common.js');
const {
	Discord,
	Config, saveConfig,
} = common;
const argumentValues = require('../enum/ArgumentValueEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

module.exports = {
	name : 'config',
	args : argumentValues.NULL,
	sub : [
		{
			name : 'prefix',
			args : argumentValues.OPTIONAL,
			usage : [
				'',
				'[newPrefix]'
			],
			description : [
				'View prefix',
				'Set new prefix'
			],
			execute(msg, suffix) {
				if (suffix == null) {
					let embed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Bot prefix')
						.setDescription('Bot prefix is currently `' + Config.prefix + '`.');
					msg.channel.send({ embed: embed });
				} else {
					let newPrefix = suffix;
					Config.prefix = newPrefix;
					saveConfig();
					common.updatePresence();
					let embed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Bot prefix set!')
						.setDescription('Bot prefix has been set to `' + newPrefix + '`.');
					msg.channel.send({ embed: embed });
				}
			}
		},
		{
			name : 'debug',
			args : argumentValues.OPTIONAL,
			usage : [
				'',
				'[true|false]'
			],
			description : [
				'View debug logging',
				'Enable/disable debug logging'
			],
			execute(msg, suffix) {
				if (suffix == null) {
					let embed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Debug mode')
						.setDescription('`debug` is set to `' + Config.debug + '`.');
					msg.channel.send({ embed: embed });
				} else {
					let boolValue = common.getBooleanValue(suffix);
					if (!common.testBooleanValue(msg, boolValue)) return false;
					Config.debug = boolValue;
					saveConfig();
					let embed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Debug mode set!')
						.setDescription('`debug` has been set to `' + suffix + '`.');
					msg.channel.send({ embed: embed });
				}
			}
		}
	]
};