module.exports = {
	name: 'sperm',
	usage: [
		'<user>'
	],
	description: [
		'Spam <user>\'s DMs.'
	],
	args: true,
	execute(msg, args) {
		if (msg.mentions)
		for (let i = 0; i < 5; i++) {
			msg.mentions.users.first().send('sperm');
		}
		msg.mentions.users.first().send('Spermed by ' + msg.author);
	}
};