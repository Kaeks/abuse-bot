module.exports = (client, oldMessage, newMessage) => {
	if (oldMessage.author.bot) {
		// discard messages created by bots
		return false;
	}
	if (oldMessage.content === newMessage.content) {
		// discard messages that were "edited" but did not change their text content
		return false;
	}
	client.logger.log('Message by ' + oldMessage.author + ' edited.');
	let combinedEntry = {
		id: oldMessage.id,
		type: oldMessage.type,
		oldContent: oldMessage.content,
		newContent: newMessage.content,
		author: {
			id: oldMessage.author.id,
			username: oldMessage.author.username,
			discriminator: oldMessage.author.discriminator
		},
		channel: {
			type: oldMessage.channel.type,
			id: oldMessage.channel.id,
		}
	};
	client.editedMessages.push(combinedEntry);
	client.fileHandler.save(client.paths.EDITED, client.editedMessages);
}
