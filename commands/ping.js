const common = require('../common');
const { Discord } = common;

const Command = require('../class/Command');

const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');

let commandPing = new Command('ping', argumentValues.NONE)
	.addDoc('', 'Pong?')
	.setExecute(msg => {
		let embed = new Discord.RichEmbed()
			.setColor(colors.PRESTIGE)
			.setTitle('Pong.');
		msg.channel.send({ embed: embed });
	});

module.exports = commandPing;
