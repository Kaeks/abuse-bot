const Discord = require.main.require('./discordjs_amends');

const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');
const { argumentValues, colors } = enums;

let commandPolizei = new Command('polizei', argumentValues.NONE)
	.addDoc('', 'TATÜ TATA.')
	.setExecute(msg => {
		let author = msg.author;
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setAuthor(author.username, author.displayAvatarURL)
			.setTitle('TATÜ TATA')
			.attachFiles(['./assets/images/polizeiblur.png'])
			.setImage('attachment://polizeiblur.png');
		msg.channel.send({ embed: embed });
	});

module.exports = commandPolizei;
