module.exports = {
	name: 'timezone',
	usage: [
		'',
		'set <time zone>'
	],
		description: [
		'Display your current set time zone.',
		'Set a new time zone. (Format: +/-HHMM)'
	],
		process: function(_, msg, suffix) {
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