const Command = require('../class/Command.js');
const SubCommand = require('../class/SubCommand.js');

const argumentValues = require('../enum/ArgumentValueEnum');
const permissionLevels = require('../enum/PermissionLevelEnum');

let testexample =
	new Command('testexample', argumentValues.OPTIONAL)
	.addDoc('', 'Example command with optional sub-commands')
	.addSub(
		new SubCommand('a', argumentValues.NONE)
			.addDoc('', 'Example sub-command that doesn\'t accept parameters.')
			.setExecute(msg => msg.reply('This is an example sub-command and doesn\'t accept parameters'))
	).addSub(
		new SubCommand('b', argumentValues.REQUIRED)
			.addDoc('<yeet>', 'Example sub-command with a required parameter')
			.setExecute((msg, suffix) => msg.reply('This is an example sub-command that requires a parameter. The passed parameter is: `' + suffix + '`.'))
	).addSub(
		new SubCommand('c', argumentValues.OPTIONAL)
			.addDoc('', 'Example sub-command with an optional sub-command')
			.addSub(
				new SubCommand('ca', argumentValues.OPTIONAL)
					.addDoc('[yah]', 'Example sub-command of a sub-command with an optional parameter')
					.setExecute((msg, suffix) => {
						let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
						msg.reply('This is an example sub-command of a sub-command that accepts a parameter but doesn\'t require one.' + addition);
					})
			).setExecute((msg, suffix) => {
				let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
				msg.reply('This is an example sub-command that accepts a parameter but doesn\'t require one.' + addition);
			})
	).addSub(
		new SubCommand('d', argumentValues.NULL, permissionLevels.SERVER_SUPERUSER)
			.addSub(
				new SubCommand('da', argumentValues.OPTIONAL)
					.addDoc('[yah]', 'Example sub-command of a sub-command only available to server-level superusers')
					.setExecute((msg, suffix) => {
						let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
						msg.reply('This is an example sub-command of a sub-command that doesn\'t accept parameters and is only available to server-level superusers.' + addition);
					})
			).addSub(
				new SubCommand('db', argumentValues.OPTIONAL, permissionLevels.BOT_SUPERUSER)
					.addDoc(
						'[yah]',
						'Example sub-command - only available to bot-level superusers - of a sub-command only available to server-level superusers'
					).setExecute((msg, suffix) => {
						let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
						msg.reply(
							'This is an example sub-command that is only available to bot-level superusers ' +
							'and is a sub-command of a sub-command that doesn\'t accept parameters ' +
							'and is only available to server-level superusers.' + addition
						);
					})
			)
	)
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : 'The parameter `' + suffix + '` was given.';
		msg.reply('This is an example command that accept a parameter but doesn\'t require one.' + addition);
	});

module.exports = testexample;
