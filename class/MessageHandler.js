const common = require('../common');

const { Discord } = common;

class MessageHandler {

	id;
	channel;
	message;

	constructor(channel) {
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
