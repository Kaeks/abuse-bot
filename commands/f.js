const common = require('../common');
const { Discord } = common;

const Command = require('../class/Command');

const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');

let commandF = new Command('f', argumentValues.NONE)
	.addDoc('', 'Pay respects.')
	.setExecute(msg => {
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setAuthor(msg.author.username, msg.author.displayAvatarURL)
			.setImage('https://cdn.discordapp.com/attachments/269556649952280576/517073107891126292/image0.jpg')
			.setFooter(msg.author.username + ' pays their respects.');
		msg.channel.send({ embed: embed });
	});

module.exports = commandF;
