const common = require('../common.js');

module.exports = {
	name : 'ping',
	args : common.argumentValues.NONE,
	usage : [ '' ],
	description : [ 'Ping!' ],
	execute(message) {
		message.channel.send('Pong.');
	}
};