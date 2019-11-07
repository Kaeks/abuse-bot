const common = require('../common.js');
const Storage = require('../data.json');
module.exports = {
	name : 'timezone',
	args : common.argumentValues.NONE,
	sub : [
		{
			name : 'set',
			args : common.argumentValues.REQUIRED,
			usage : '<timezone>',
			description : 'Set a new time zone. (Format: +/-HHMM)'
		}
	],
	usage :	'',
	description : 'Display your current set time zone.',
	execute(msg, suffix) {
		if (suffix === '') {
			getTimeZone(msg.author);
		}
		let args = suffix.split(' ');
		if (args[0] === 'set') {
			if (args[1] !== undefined) {
				let user = msg.author;
				Storage.users[user].timezone = args[1];
			} else {
				msg.channel.send('Missing argument: <time zone>').then(message => message.delete(3000));
			}
		}
	}
};