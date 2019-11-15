const common = require('../common.js');
const { Discord } = common;
const argumentValues = require('../enum/ArgumentValueEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

module.exports = {
	name : 'f',
	args : argumentValues.NONE,
	usage : [ '' ],
	description : [ 'Pay respects.' ],
	execute(msg) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setAuthor(msg.author.username, msg.author.displayAvatarURL)
			.setImage('https://cdn.discordapp.com/attachments/269556649952280576/517073107891126292/image0.jpg')
			.setFooter(msg.author.username + ' pays their respects.');
		msg.channel.send({ embed: embed });
	}
};