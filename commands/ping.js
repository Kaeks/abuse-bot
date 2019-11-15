const common = require('../common.js');
const { Discord } = common;
const argumentValues = require('../enum/ArgumentValueEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

module.exports = {
	name : 'ping',
	args : argumentValues.NONE,
	usage : [ '' ],
	description : [ 'Pong?' ],
	execute(msg) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.PRESTIGE)
			.setTitle('Pong.');
		msg.channel.send({ embed: embed });
	}
};