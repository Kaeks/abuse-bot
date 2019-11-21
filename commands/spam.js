const common = require('../common');
const { Discord } = common;
const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');

module.exports = {
	name : 'spam',
	args : argumentValues.REQUIRED,
	usage : '<user>',
	description : 'Spam <user>\'s DMs.',
	execute(msg) {
		if (msg.channel.type === 'dm') {
			let embed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('Not available!')
				.setDescription('Spamming is not available in DMs.');
			msg.channel.send({ embed: embed })
				.then(message => message.delete(5000));
			return false;
		}
		if (msg.mentions.users.size > 0) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.PRESTIGE)
				.setAuthor(msg.author.username, msg.author.displayAvatarURL)
				.setImage('https://cdn.vox-cdn.com/thumbor/' +
					'UO1hhAGb7ea5G-MuC43l1Sxx9Rw=/0x0:2282x1712/1200x675/' +
					'filters:focal(0x0:2282x1712)/' +
					'cdn.vox-cdn.com/uploads/chorus_image/image/50821489/spam-wall.0.0.jpg')
				.setFooter(msg.author.username + ' has sent you some SPAM.');
			msg.mentions.users.first().send({ embed: embed });
		}
	}
};
