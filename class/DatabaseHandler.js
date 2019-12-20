import * as Discord from 'discord.js';

class DatabaseHandler {

	db;
	statements;

	constructor(db) {
		this.db = db;
		this.statements = {
			getServer : db.prepare('SELECT * FROM servers WHERE id = ?;'),
			addServer : db.prepare('INSERT OR REPLACE INTO servers (id, name, ownerId) VALUES (@id, @name, @ownerId);'),
			updateServerName : db.prepare('UPDATE servers SET name = @name WHERE id = @id;'),
			updateServerOwnerId : db.prepare('UPDATE servers SET ownerId = @ownerId WHERE id = @id;'),
			updateServerWednesdayChannelId : db.prepare('UPDATE servers SET wednesdayChannelId = @wednesdayChannelId WHERE id = @id;'),
			updateServerWednesdayEnabled : db.prepare('UPDATE servers SET wednesday = @wednesday WHERE id = @id;'),
			getUser : db.prepare('SELECT * FROM users WHERE id = ?;'),
			addUser : db.prepare('INSERT OR REPLACE INTO users (id, name, discriminator) VALUES (@id, @name, @discriminator);'),
			addChannel : db.prepare('INSERT INTO channels (id, type) VALUES (@id, @type);'),
			addDmChannel : db.prepare('INSERT INTO dm_channels (id, recipientId) VALUES (@id, @recipientId);'),
			addTextChannel : db.prepare('INSERT INTO text_channels (id, serverId, name) VALUES (@id, @serverId, @name);'),
			updateTextChannelName : db.prepare('UPDATE text_channels SET name = @name WHERE id = @id;'),
			addMessage : db.prepare('INSERT INTO messages (id, authorId, channelId) VALUES (@id, @authorId, @channelId);'),
			addEditedMessage : db.prepare('INSERT INTO message_edits (messageId, oldContent, newContent, date) VALUES (@messageId, @oldContent, @newContent, @date);'),
			addMessageEmbed : db.prepare('INSERT INTO message_embeds (messageId, data) VALUES (@messageId, @data);'),
			addMessageAttachment : db.prepare('INSERT INTO message_attachments (messageId, filename, filesize, url, proxyURL) VALUES (@messageId, @filename, @filesize, @url, @proxyURL);'),
			setMessageDeleted : db.prepare('UPDATE messages SET deleted = @deleted, deletedContent = @deletedContent WHERE id = @id;'),
			addServerAdmin : db.prepare('INSERT OR REPLACE INTO server_admins (userId, serverId) VALUES (@userId, @serverId);'),
			removeServerAdmin : db.prepare('DELETE FROM server_admins WHERE userId = @userId AND serverId = @serverId;')
		}
	}

	addUser(user) {
		client.statements.setupUser.run({
			id : user.id,
			name : user.username,
			discriminator : user.discriminator,
		});
	}

	addServer(server) {
		client.statements.setupServer.run({
			id : server.id,
			name : server.name,
			ownerId : server.ownerID
		});
	}

	updateServerName(server, name) {
		client.statements.updateServerName.run({
			id : server.id,
			name : server.name
		});
	}

	updateServerOwnerId(serve, ownerId) {
		client.statements.updateServerOwnerId.run({
			id : server.id,
			ownerId : server.ownerID
		});
	}

	addChannel(channel) {
		client.statements.addChannel.run({
			id : channel.id,
			type : channel.type
		});
	}

	addDmChannel(channel) {
		this.addUser(channel.recipient);
		this.addChannel(channel);
		client.statements.addDmChannel.run({
			id : channel.id,
			recipientId : channel.recipient.id
		});
	}

	addTextChannel(channel) {
		this.addServer(channel.guild);
		this.addChannel(channel);
		client.statements.addTextChannel.run({
			id : channel.id,
			serverId : channel.guild.id,
			name : channel.name
		});
	}

	addMessage(message) {
		let channel = message.channel;
		if (channel instanceof Discord.TextChannel) {
			this.addTextChannel(channel);
		} else if (channel instanceof Discord.DMChannel) {
			this.addDmChannel(channel);
		}
		client.statements.addMessage.run({
			id : message.id,
			authorId : message.author.id,
			channelId : message.channel.id
		});
	}

	addEditedMessage(oldMessage, newMessage) {
		this.addMessage(oldMessage);
		client.statements.addEditedMessage.run({
			messageId : oldMessage.id,
			oldContent : oldMessage.content,
			newContent : newMessage.content,
			date : new Date().toString()
		});
	}

}