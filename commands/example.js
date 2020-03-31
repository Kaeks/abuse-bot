const classes = require.main.require('./class');
const { Command, SubCommand } = classes;

const enums = require.main.require('./enum');
const { argumentValues, permissionLevels } = enums;

let commandExampleA = new SubCommand('a', argumentValues.NONE)
	.addDoc('', 'Example sub-command that doesn\'t accept parameters.')
	.setExecute(msg => msg.reply('This is an example sub-command that doesn\'t accept parameters'));

let commandExampleB = new SubCommand('b', argumentValues.REQUIRED)
	.addDoc('<yeet>', 'Example sub-command with a required parameter')
	.setExecute((msg, suffix) => msg.reply('This is an example sub-command that requires a parameter. The passed parameter is: `' + suffix + '`.'));

let commandExampleCA = new SubCommand('ca', argumentValues.OPTIONAL)
	.addDoc('[yah]', 'Example sub-command of a sub-command with an optional parameter')
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
		msg.reply('This is an example sub-command of a sub-command that accepts a parameter but doesn\'t require one.' + addition);
	});

let commandExampleC = new SubCommand('c', argumentValues.OPTIONAL)
	.addDoc('', 'Example sub-command with an optional sub-command')
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
		msg.reply('This is an example sub-command that accepts a parameter but doesn\'t require one.' + addition);
	})
	.addSub(commandExampleCA);

let commandExampleDA = new SubCommand('da', argumentValues.NULL)
	.addDoc('[yah]', 'Example sub-command of a sub-command only available to server-level superusers')
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : ' The parameter `' + suffix + '` was given.';
		msg.reply('This is an example sub-command of a sub-command that doesn\'t accept parameters and is only available to server-level superusers.' + addition);
	});

let commandExampleDB = new SubCommand('db', argumentValues.OPTIONAL, permissionLevels.BOT_SUPERUSER)
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
	});

let commandExampleD = new SubCommand('d', argumentValues.NULL, permissionLevels.SERVER_SUPERUSER)
	.addDoc('', 'Example command with optional sub-commands')
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : 'The parameter `' + suffix + '` was given.';
		msg.reply('This is an example command that accepts a parameter but doesn\'t require one.' + addition);
	})
	.addSub(commandExampleDA)
	.addSub(commandExampleDB);

let commandExample = new Command('example', argumentValues.OPTIONAL)
	.addSub(commandExampleA)
	.addSub(commandExampleB)
	.addSub(commandExampleC)
	.addSub(commandExampleD)
	.setExecute((msg, suffix) => {
		let addition = suffix === null ? ' There was no parameter given.' : 'The parameter `' + suffix + '` was given.';
		msg.reply('This is an example command that accepts a parameter but doesn\'t require one.' + addition);
	});

module.exports = commandExample;
