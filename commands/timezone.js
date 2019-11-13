const common = require('../common.js');
const {
	Discord, Storage,
	getTimeZone
} = common;

module.exports = {
	name : 'timezone',
	args : common.argumentValues.NONE,
	sub : [
		{
			name : 'set',
			args : common.argumentValues.REQUIRED,
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