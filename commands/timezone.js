const common = require('../common.js');
const {
	Discord, Storage,
	getTimeZone
} = common;
const argumentValues = require('../enum/ArgumentValueEnum.js');

module.exports = {
	name : 'timezone',
	args : argumentValues.NONE,
	sub : [
		{
			name : 'set',
			args : argumentValues.REQUIRED,
			usage : '<timezone>',
			description : 'Set a new time zone. (Format: +/-HHMM)',
			execute(msg, suffix) {
				let user = msg.author;
				Storage.users[user].timezone = suffix;
			}
		}
	],
	usage :	'',
	description : 'Display your current set time zone.',
	execute(msg, suffix) {
		getTimeZone(msg.author);
	}
};