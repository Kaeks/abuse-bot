const common = require('../common.js');
const { Discord } = common;

module.exports = {
	name : 'ping',
	args : common.argumentValues.NONE,
	usage : [ '' ],
	description : [ 'Pong?' ],
	execute(msg) {
		let embed = new Discord.RichEmbed()
			.setColor(common.colors.PRESTIGE)
			.setTitle('Pong.');
		msg.channel.send({ embed: embed });
	}
};