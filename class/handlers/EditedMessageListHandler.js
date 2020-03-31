const Discord = require.main.require('./discordjs_amends');

const MessageHandler = require.main.require('./class/handlers/MessageHandler');

const enums = require.main.require('./enum');
const { colors } = enums;

class EditedMessageListHandler extends MessageHandler {

	index;
	currentMessage;
	editedList;

	JUMP_AMOUNT = 10;

	EMOJI_BEGINNING = '⏮';
	EMOJI_REW = '⏪';
	EMOJI_PREV = '◀';
	EMOJI_NEXT = '▶';
	EMOJI_FF = '⏩';
	EMOJI_END = '⏭';

	constructor(client, channel, editedList, index = 0) {
		super(client, channel);
		this.editedList = editedList;
		this.index = index;
	}

	changeIndex(index) {
		if (index < 0) throw 'Attempted to access index smaller than 0.';
		if (index + 1 > this.pages) throw 'Index ' + index + ' doesn\'t exist for ' + this.id + '.';
		this.index = index;
		this.updateMessage();
		return true;
	}

	/**
	 * Jumps to the beginning of the list
	 * @returns {Boolean} Success
	 */
	goBeginning() {
		return this.changeIndex(0);
	}

	/**
	 * Jumps to the end of the list
	 * @returns {Boolean} Success
	 */
	goEnd() {
		return this.changeIndex(this.editedList.length - 1);
	}

	/**
	 * Jumps ahead {JUMP_AMOUNT} items, or until the last index has been hit
	 * @returns {Boolean} Success
	 */
	jumpAhead() {
		if (this.index + this.JUMP_AMOUNT < this.editedList.length) return this.changeIndex(this.index + this.JUMP_AMOUNT);
		else return this.goEnd();
	}

	/**
	 * Jumps back {JUMP_AMOUNT} items, or until index 0 has been hit
	 */
	jumpBack() {
		if (this.index - this.JUMP_AMOUNT >= 0) return this.changeIndex(this.index - this.JUMP_AMOUNT);
		else return this.goBeginning();
	}

	/**
	 * Goes to the next index
	 * @returns {Boolean} Success
	 */
	goNext() {
		if (this.index + 1 >= this.editedList.length) return false;
		return this.changeIndex(this.index + 1);
	}

	/**
	 * Goes to the previous index
	 * @returns {Boolean} Success
	 */
	goPrev() {
		if (this.index <= 0) return false;
		return this.changeIndex(this.index - 1);
	}

	async getEmbed() {
		let entry = this.editedList[this.index];
		let embedText = 'In channel ' + this.channel + ':' +
			'\n> ' + entry.oldContent + '\nto\n> ' + entry.newContent;
		let channel = this.client.channels.get(entry.channel.id);
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
			author = this.client.users.get(entry.author.id);
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
			await message.react(this.EMOJI_BEGINNING);
			await message.react(this.EMOJI_REW);
			await message.react(this.EMOJI_PREV);
			await message.react(this.EMOJI_NEXT);
			await message.react(this.EMOJI_FF);
			await message.react(this.EMOJI_END);
			this.client.reactionListenerHandler.add(message, messageReaction => {
				switch (messageReaction.emoji.name) {
					case this.EMOJI_BEGINNING: this.goBeginning(); break;
					case this.EMOJI_REW: this.jumpBack(); break;
					case this.EMOJI_PREV: this.goPrev(); break;
					case this.EMOJI_NEXT: this.goNext(); break;
					case this.EMOJI_FF: this.jumpAhead(); break;
					case this.EMOJI_END: this.goEnd(); break;
				}
			}, [ this.EMOJI_BEGINNING, this.EMOJI_REW, this.EMOJI_PREV, this.EMOJI_NEXT, this.EMOJI_FF, this.EMOJI_END ])
		});
	}
}

module.exports = EditedMessageListHandler;
