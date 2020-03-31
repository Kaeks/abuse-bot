const Discord = require.main.require('./discordjs_amends');

const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class MessageHandler extends ClientBasedHandler {

	id;
	channel;
	message;

	constructor(client, channel) {
		super(client);
		
		this.channel = channel;
		this.id = Discord.SnowflakeUtil.generate();
	}

	async updateMessage() {
		let updatedEmbed = await this.getEmbed();
		this.message.edit(updatedEmbed).catch(console.error);
	}

	async getEmbed() {

	}

	async build() {

	}

}

module.exports = MessageHandler;
