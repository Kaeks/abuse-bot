const common = require('../common.js');
const Storage = require('../data.json');
module.exports = {
	name: 'config',
	usage: [
		'prefix',
		'prefix <newPrefix>',
		'debug',
		'debug <true|false>'
	],
	description: [
		'View prefix',
		'Set new prefix',
		'View debug logging',
		'Enable/disable debug logging'
	],
	execute(msg, suffix) {
		if (suffix === '') {
			msg.channel.send(getHelpEmbed('config'));
		}
		let args = suffix.split(' ');
		if (args[0] === 'prefix') {
			if (args.length === 1) {
				msg.channel.send('Bot prefix is currently `' + Storage.prefix + '`.');
			} else {
				let newPrefix = suffix.substring('prefix '.length);
				Storage.prefix = newPrefix;
				msg.channel.send('Bot prefix has been set to `' + newPrefix + '`.');
				writeData();
				msg.client.updatePresence();
			}

		} else if (args[0] === 'debug') {
			if (args.length === 1) {
				msg.channel.send('`debug` is set to `' + Storage.debug + '`.');
			} else {
				if (args[1] === 'true' || args[1] === 'false') {
					Storage.debug = args[1];
					msg.channel.send('`debug` has been set to `' + args[1] + '`.');
					writeData();
				} else {
					msg.channel.send('Excuse me, what the frick?').then((message => message.delete(3000)));
				}
			}
		}
	}
};