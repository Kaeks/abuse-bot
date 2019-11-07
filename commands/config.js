const common = require('../common.js');
const {
	fs,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveData, saveBlocked, saveDeleted, saveEdited, saveConfig,
	waterTimers, runningTimers,
	sendWednesday
} = common;
const Discord = require('discord.js');

module.exports = {
	name : 'config',
	args : common.argumentValues.NULL,
	sub : [
		{
			name : 'prefix',
			args : common.argumentValues.OPTIONAL,
			usage : [
				'',
				'<newPrefix>'
			],
			description : [
				'View prefix',
				'Set new prefix'
			],
			execute(msg, suffix) {
				if (suffix == null) {
					msg.channel.send('Bot prefix is currently `' + Config.prefix + '`.');
				} else {
					let newPrefix = suffix;
					Config.prefix = newPrefix;
					saveConfig();
					msg.channel.send('Bot prefix has been set to `' + newPrefix + '`.');
					common.updatePresence();
				}
			}
		},
		{
			name : 'debug',
			args : common.argumentValues.OPTIONAL,
			usage : [
				'',
				'<true|false>'
			],
			description : [
				'View debug logging',
				'Enable/disable debug logging'
			],
			execute(msg, suffix) {
				if (suffix == null) {
					msg.channel.send('`debug` is set to `' + Config.debug + '`.');
				} else {
					let newVal = common.getBooleanValue(suffix);
					if (newVal === undefined) {
						msg.channel.send('Must be `true` or `false`.').then((message => message.delete(3000)));
						return false;
					}
					Config.debug = newVal;
					msg.channel.send('`debug` has been set to `' + suffix + '`.');
					saveConfig();
				}
			}
		}
	]
};