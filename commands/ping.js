const Discord = require.main.require('./discordjs_amends');

const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');
const { argumentValues, colors } = enums;

let commandPing = new Command('ping', argumentValues.NONE)
	.addDoc('', 'Pong?')
	.setExecute(msg => {
		let embed = new Discord.RichEmbed()
			.setColor(colors.PRESTIGE)
			.setTitle('Pong.');
		msg.channel.send({ embed: embed });
	});

module.exports = commandPing;
