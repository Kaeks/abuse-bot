const common = require('../common.js');
module.exports = {
	name : 'sperm',
	args : common.argumentValues.REQUIRED,
	usage : '<user>',
	description : 'Spam <user>\'s DMs.',
	execute(msg, args) {
		if (msg.mentions) {
			for (let i = 0; i < 5; i++) {
				msg.mentions.users.first().send('sperm');
			}
			msg.mentions.users.first().send('Spermed by ' + msg.author);
		}
	}
};