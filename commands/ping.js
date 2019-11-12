const common = require('../common.js');

module.exports = {
	name : 'ping',
	args : common.argumentValues.NONE,
	usage : [ '' ],
	description : [ 'Ping!' ],
	execute(msg) {
		msg.channel.send('Pong.');
	}
};