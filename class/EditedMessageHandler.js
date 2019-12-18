const common = require('../common');
const { Discord, client, addReactionListener } = common;

const MessageHandler = require('./MessageHandler');

const enums = require('../enum');
const { colors } = enums;

class EditedMessageHandler extends MessageHandler {

	index;
	currentMessage;
	editedList;

	EMOJI_PREV = '◀';
	EMOJI_NEXT = '▶';

	constructor(channel, editedList, index = 0) {
		super(channel);
		this.editedList = editedList;
		this.index = index;
	}

	changeIndex(index) {
		if (index < 0) throw 'Attempted to access index smaller than 0.';
		if (index + 1 > this.pages) throw 'Index ' + index + ' doesn\'t exist for ' + this.id + '.';
		this.index = index;
		this.updateMessage();
	}

	goNext() {
		if (this.index + 1 >= this.editedList.length) return false;
		this.changeIndex(this.index + 1);
	}

	goPrev() {
		if (this.index <= 0) return false;
		this.changeIndex(this.index - 1);
	}

	async getEmbed() {
		let entry = this.editedList[this.index];
		let embedText = 'In channel ' + this.channel + ':' +
			'\n> ' + entry.oldContent + '\nto\n> ' + entry.newContent;
		let channel = client.channels.get(entry.channel.id);
		let linkString;
		let author;
		try {
			this.currentMessage = await channel.fetchMessage(entry.id);
			author = this.currentMessage.author;
			let link = this.currentMessage.getLink();
			linkString = '[Message link](<' + link + '>)';
			embedText += '\n' + linkString;
		} catch (e) {
			embedText += '\n' + 'The original message was deleted.';
			author = client.users.get(entry.author.id);
		}
		return new Discord.RichEmbed()
			.setColor(colors.PRESTIGE)
			.setTitle('Edited message')
			.setDescription(embedText)
			.setAuthor(author.getHandle(), author.avatarURL)
			.setFooter('#' + (this.index + 1) + ' of ' + this.editedList.length);
	}

	async build() {
		await super.build();
		let initialEmbed = await this.getEmbed();
		this.channel.send({ embed: initialEmbed }).then(async message => {
			this.message = message;
			await message.react(this.EMOJI_PREV);
			await message.react(this.EMOJI_NEXT);
			addReactionListener(message, messageReaction => {
				switch (messageReaction.emoji.name) {
					case this.EMOJI_PREV: this.goPrev(); break;
					case this.EMOJI_NEXT: this.goNext(); break;
				}
			}, [ this.EMOJI_PREV, this.EMOJI_NEXT ])
		});
	}
}

module.exports = EditedMessageHandler;
