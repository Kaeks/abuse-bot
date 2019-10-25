const common = require('../common.js');
module.exports = {
	name: 'ping',
	description: [
		'Ping!'
	],
	execute(message, args) {
		message.channel.send('Pong.');
	}
};