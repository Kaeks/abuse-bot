module.exports = {
	name: 'help',
	usage: [
		'',
		'<command>'
	],
		description: [
		'Show help for all commands.',
		'Show help for <command>'
	],
		process: function(_, msg, suffix) {
		let embed;
		if (suffix) {
			let helpCmd = suffix.split(' ').filter(function(thing) {
				return commands[thing];
			});
			embed = getHelpEmbed(helpCmd);
		} else {
			embed = getHelpEmbed();
		}
		msg.author.send(embed);
	}
};