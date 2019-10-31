const common = require('../common.js');
const Discord = require('discord.js');
const Storage = require('../data.json');

/*
	'args' property:
	0: NO arguments
	1: OPTIONAL arguments
	2: REQUIRES arguments
 */

module.exports = {
	name : 'example',
	args : common.argumentValues.OPTIONAL,
	sub : [
		{
			name : 'a',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'example subcommand without parameter'
		},
		{
			name : 'b',
			args : common.argumentValues.REQUIRED,
			usage : '<yeet>',
			description : 'example subcommand with required parameter'
		},
		{
			name : 'c',
			args : common.argumentValues.OPTIONAL,
			sub : [
				{
					name : 'ca',
					args : common.argumentValues.OPTIONAL,
					usage : '[yah]',
					description : 'example subcommand of subcommand with optional parameter'
				}
			],
			usage : '',
			description : 'example subcommand with optional subcommand'
		}
	],
	usage : '',
	description : 'example command with optional subcommands',

	execute(msg, suffix) {
		msg.reply('this command does straight up nothing dude lmao');
	}
};