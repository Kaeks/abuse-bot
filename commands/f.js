const Discord = require.main.require('./discordjs_amends');

const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');
const { argumentValues, colors } = enums;

let commandF = new Command('f', argumentValues.NONE)
	.addDoc('', 'Pay respects.')
	.setExecute(msg => {
		let author = msg.author;
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setAuthor(author.username, author.displayAvatarURL)
			.setImage('https://cdn.discordapp.com/attachments/269556649952280576/517073107891126292/image0.jpg')
			.setFooter(author.username + ' pays their respects.');
		msg.channel.send({ embed: embed });
	});

module.exports = commandF;
