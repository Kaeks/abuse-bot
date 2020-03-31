/**
 * Handles an incoming message
 * @param client
 * @param msg
 */
module.exports = async (client, msg) => {
    if (msg.author.bot) return;
	if (msg.author === client.getOwner() && msg.content === 'wiktor pls crash') throw JSON.stringify({a:0,b:1,c:2});
	if (client.isCommand(msg)) {
		let executedCommand = client.handleCommand(msg);
		if (msg.channel.type === 'dm' || msg.channel.type === 'group') return;
		if (msg.guild.me.permissions.has('MANAGE_MESSAGES') && (executedCommand === null || executedCommand.delete === true)) {
				msg.delete(5000);
		}
		return;
	}
	// Message is not a command, handle non-command interactions
	let eatAss = msg.content.match(/(?:^|[\s])((eat\sass)|(eat\s.*\sass))(?=\s|$)/i);
	let ummah = msg.content.match(/u((mah+)|(m{2,}ah*))/i);
	if (msg.mentions.everyone) {
		msg.channel.send("@everyone? Really? @everyone? Why would you ping @everyone, " + msg.author + "?");
		return;
	}
	let saidBadWord = msg.content.match(client.badWordsRegExp);
	if (msg.isMentioned(client.user) || msg.channel.type === 'dm') {
		if (eatAss) {
			if (ummah) msg.channel.send('Gladly, ' + msg.author + ' UwU');
			else msg.channel.send('Hey, ' + msg.author + ', how about you eat mine?');
		} else {
			if (ummah) msg.channel.send(msg.author + ' :kiss:');
			else if (saidBadWord) msg.channel.send('No u, ' + msg.author + '.');
			else if (msg.isMentioned(client.user)) msg.channel.send('wassup ' + msg.author);
		}
	} else {
		if (eatAss) msg.channel.send('Hey, ' + msg.author + ', that\'s not very nice of you!');
		else if (client.config.badWordFilter === true && saidBadWord) msg.channel.send('Whoa there buddy. Mind your language, ' + msg.author + ', there\'s kids around!')
	}
}
