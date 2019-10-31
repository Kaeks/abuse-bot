const common = require('../common.js');

module.exports = {
	name : 'ping',
	args : common.argumentValues.NONE,
	usage : '',
	description : 'Ping!',
	execute(message, args) {
		message.channel.send('Pong.');
	}
};