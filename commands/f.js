module.exports = {
	name: 'f',
	usage: [
		''
	],
		description: [
		'Pay respects.'
	],
		process: function(_, msg, suffix) {
		let embed = new Discord.RichEmbed()
			.setColor(0x00AE86)
			.setAuthor(msg.author.username, msg.author.displayAvatarURL)
			.setImage('https://cdn.discordapp.com/attachments/269556649952280576/517073107891126292/image0.jpg')
			.setFooter(msg.author.username + ' pays their respects.');
		msg.channel.send({embed});
	}
};