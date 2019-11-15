const common = require('../common.js');
const argumentValues = require('../enum/ArgumentValueEnum.js');

module.exports = {
	name : 'example',
	args : argumentValues.OPTIONAL,
	sub : [
		{
			name : 'a',
			args : argumentValues.NONE,
			usage : '',
			description : 'Example sub-command that doesn\'t accept parameters.',
			execute(msg) {
				msg.reply('This is an example sub-command and doesn\'t accept parameters');
			}
		},
		{
			name : 'b',
			args : argumentValues.REQUIRED,
			usage : '<yeet>',
			description : 'Example sub-command with a required parameter',
			execute(msg, suffix) {
				msg.reply('This is an example sub-command that requires a parameter. The passed parameter is: `' + suffix + '`.');
			}
		},
		{
			name : 'c',
			args : argumentValues.OPTIONAL,
			sub : [
				{
					name : 'ca',
					args : argumentValues.OPTIONAL,
					usage : '[yah]',
					description : 'Example sub-command of a sub-command with an optional parameter',
					execute(msg, suffix) {
						let addition = suffix.split(' ')[0] === '' ? ' There was no parameter given.' : 'The paramater `' + suffix + '` was given.';
						msg.reply('This is an example sub-command of a sub-command that accepts a parameter but doesn\'t require one.' + addition);
					}
				}
			],
			usage : '',
			description : 'Example sub-command with an optional sub-command',
			execute(msg, suffix) {
				let addition = suffix.split(' ')[0] === '' ? ' There was no parameter given.' : 'The paramater `' + suffix + '` was given.';
				msg.reply('This is an example sub-command that accepts a parameter but doesn\'t require one.' + addition);
			}
		}
	],
	usage : '',
	description : 'Example command with optional sub-commands',
	execute(msg, suffix) {
		let addition = suffix.split(' ')[0] === '' ? ' There was no parameter given.' : 'The paramater `' + suffix + '` was given.';
		msg.reply('This is an example command that accept a parameter but doesn\'t require one.' + addition);
	}
};