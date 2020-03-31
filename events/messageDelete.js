module.exports = (client, message) => {
	// Discard messages created by bots
	if (message.author.bot) return false;
	// Discard messages that were commands (and thus deleted by the bot)
	if (client.isCommand(message)) return false;

	client.logger.log('Message by ' + message.author + ' deleted.');
	let shortened = {
		id: message.id,
		content: message.content,
		author: {
			id: message.author.id,
			username: message.author.username,
			discriminator: message.author.discriminator
		},
		channel: {
			type: message.channel.type,
			id: message.channel.id,
		}
	};
	if (message.embeds.length > 0) {
		shortened.embeds = 'yes';
	}
	if (message.attachments.size > 0) {
		let shortenedAttachments = [];
		message.attachments.forEach(function(value) {
			shortenedAttachments.push(
				{
					id: value.id,
					filename: value.filename,
					url: value.url,
					proxyURL: value.proxyURL
				}
			);
		});
		shortened.attachments = shortenedAttachments;
	}
	Deleted.push(shortened);
    client.fileHandler.save(client.paths.DELETED, client.deletedMessages);
}
