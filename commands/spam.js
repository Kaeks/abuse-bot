const common = require('../common.js');
const { Discord } = common;

module.exports = {
	name : 'spam',
	args : common.argumentValues.REQUIRED,
	usage : '<user>',
	description : 'Spam <user>\'s DMs.',
	execute(msg) {
		if (msg.channel.type === 'dm') {
			msg.channel.send('Spamming is not available in DMs.');
			return false;
		}
		if (msg.mentions.users.size > 0) {
			let embed = new Discord.RichEmbed()
				.setColor(0x000AE86)
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
