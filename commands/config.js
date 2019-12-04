const common = require('../common');
const {
	Discord,
	Config, saveConfig,
} = common;

const Command = require('../class/Command');
const SubCommand = require('../class/SubCommand');

const argumentValues = require('../enum/ArgumentValueEnum');
const permissionLevels = require('../enum/PermissionLevelEnum');
const colors = require('../enum/EmbedColorEnum');

let commandConfigPrefix = new SubCommand('prefix', argumentValues.OPTIONAL)
	.addDoc('', 'View prefix')
	.addDoc('[newPrefix]', 'Set new prefix')
	.setExecute((msg, suffix) => {
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
	});

let commandConfigDebug = new SubCommand('debug', argumentValues.OPTIONAL)
	.addDoc('', 'View debug logging.')
	.addDoc('[true|false]', 'Enable/disable debug logging.')
	.setExecute((msg, suffix) => {
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
	});

let commandConfigProfanityFilter = new SubCommand('profanityfilter', argumentValues.OPTIONAL)
	.addDoc('', 'View status of the profanity filter.')
	.addDoc('[true|false]', 'Enable/disable the profanity filter.')
	.setExecute((msg, suffix) => {
		if (suffix == null) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Profanity filter')
				.setDescription('The value for the profanity filter is set to `' + Config.badWordFilter + '`.');
			msg.channel.send({ embed: embed });
		} else {
			let boolValue = common.getBooleanValue(suffix);
			if (!common.testBooleanValue(msg, boolValue)) return false;
			Config.badWordFilter = boolValue;
			saveConfig();
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Profanity filter set!')
				.setDescription('The value for the profanity filter has been set to `' + suffix + '`.');
			msg.channel.send({ embed: embed });
		}
	});

let commandConfig = new Command('config', argumentValues.NULL, permissionLevels.BOT_SUPERUSER)
	.addSub(commandConfigPrefix)
	.addSub(commandConfigDebug)
	.addSub(commandConfigProfanityFilter);

module.exports = commandConfig;
