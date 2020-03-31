const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const classes = require.main.require('./class');
const { Command, SubCommand } = classes;

const enums = require.main.require('./enum');
const { argumentValues, permissionLevels, colors } = enums;

let commandConfigPrefix = new SubCommand('prefix', argumentValues.OPTIONAL)
	.addDoc('', 'View prefix')
	.addDoc('[newPrefix]', 'Set new prefix')
	.setExecute((msg, suffix) => {
		let client = msg.client;
		let config = client.config;
		if (suffix == null) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Bot prefix')
				.setDescription('Bot prefix is currently `' + config.prefix + '`.');
			msg.channel.send({ embed: embed });
		} else {
			let newPrefix = suffix;
			config.prefix = newPrefix;
			client.configHandler.save();
			client.updatePresence();
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
		let client = msg.client;
		let config = client.config;
		if (suffix == null) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Debug mode')
				.setDescription('`debug` is set to `' + config.debug + '`.');
			msg.channel.send({ embed: embed });
		} else {
			let boolValue = util.getBooleanValue(suffix);
			if (!util.testBooleanValue(msg, boolValue)) return false;
			config.debug = boolValue;
			client.configHandler.save();
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
		let client = msg.client;
		let config = client.config;
		if (suffix == null) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Profanity filter')
				.setDescription('The value for the profanity filter is set to `' + config.badWordFilter + '`.');
			msg.channel.send({ embed: embed });
		} else {
			let boolValue = util.getBooleanValue(suffix);
			if (!util.testBooleanValue(msg, boolValue)) return false;
			config.badWordFilter = boolValue;
			client.configHandler.save();
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
