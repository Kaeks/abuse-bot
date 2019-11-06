const common = require('../common.js');
const {
	fs,
	Config, Storage, Blocked, Deleted, Edited,
	loadFile, saveFile,
	saveData, saveBlocked, saveDeleted, saveEdited, saveConfig,
	waterTimers, runningTimers,
	sendDM, sendWednesday
} = common;
const Discord = require('discord.js');

module.exports = {
	name : 'config',
	args : common.argumentValues.REQUIRED,
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

			}
		}
	],
	execute(msg, suffix) {if (args[0] === 'debug') {
			if (args.length === 1) {
				msg.channel.send('`debug` is set to `' + Storage.debug + '`.');
			} else {
				if (args[1] === 'true' || args[1] === 'false') {
					Config.debug = args[1];
					msg.channel.send('`debug` has been set to `' + args[1] + '`.');
					saveData();
				} else {
					msg.channel.send('Excuse me, what the frick?').then((message => message.delete(3000)));
				}
			}
		}
	}
};