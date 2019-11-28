const common = require('../common');
const { Discord } = common;

const reactionEvents = require('../enum/ReactionEventEnum');
const colors = require('../enum/EmbedColorEnum');
const emojiNums = require('../enum/EmojiNumEnum')

// ms
const LISTENING_TIME = 30 * 60 * 1000;

class ReminderList {
	id;
	reminders;
	userMsg;
	msg;
	curPage = 0;
	pages;
	expireDate;
	timer;

	ITEM_LIMIT = 5;
	EMOJI_PREV = '◀';
	EMOJI_NEXT = '▶';

	constructor(userMsg, collection) {
		this.id = Discord.SnowflakeUtil.generate();
		this.reminders = collection;
		this.userMsg = userMsg;
		this.pages = Math.ceil(collection.size / this.ITEM_LIMIT);
	}

	startExpireTimer() {
		let me = this;
		this.expireDate = new Date(new Date().valueOf() + LISTENING_TIME);
		let diff = this.expireDate - new Date();
		this.timer = setTimeout(function() {
			me.delete();
		}, diff);
	}

	stopExpireTimer() {
		clearTimeout(this.timer);
		this.timer = undefined;
	}

	resetExpireTimer() {
		this.stopExpireTimer();
		this.startExpireTimer();
		common.debug('Reset reminder list expire timer with id ' + this.id + '.');
	}

	delete() {
		this.stopExpireTimer();
		this.msg.delete().catch(console.error);
		common.debug('Deleted reminder list with id ' + this.id + '.');
	}

	getReminderOfCurList(num) {
		let iterator = 0;
		for (let reminderEntry of this.reminders.getSubList(this.ITEM_LIMIT, this.curPage)) {
			if (iterator === num) {
				return reminderEntry[1];
			}
			iterator++;
		}
	}

	updateMessage() {
		let updatedEmbed = this.getEmbed(this.msg.channel);
		this.msg.edit(updatedEmbed).catch(console.error);
		common.debug('Updated message of reminder list with id ' + this.id + '.');
	}

	changePage(page) {
		if (page < 0) throw 'Attempted to access page smaller than 0.';
		if (page + 1 > this.pages) throw 'Page ' + page + ' doesn\'t exist for reminderList ' + this.id + '.';
		this.curPage = page;
		this.updateMessage();
	}

	goNextPage() {
		if (this.curPage + 1 >= this.pages) return false;
		this.changePage(this.curPage + 1);
	}

	goPrevPage() {
		if (this.curPage === 0) return false;
		this.changePage(this.curPage - 1);
	}

	getPageText() {
		return this.pages > 1 ? 'Page ' + (this.curPage + 1) + ' of ' + this.pages : '';
	}

	getFooterText(channel) {
		let footerText = '';
		if (channel.type !== 'dm') footerText += 'React with a number to join that reminder!';
		if (this.pages > 1) footerText += ' Use ' + this.EMOJI_PREV + ' and ' + this.EMOJI_NEXT + ' to shuffle through the list.';
		return footerText;
	}

	getEmbed(channel) {
		// Throw error when we are on a page that doesn't exist with the amount of reminders the user has
		// e.g. page 1000 does not exist with only 10 reminders
		if (this.reminders.size < this.curPage * this.ITEM_LIMIT + 1) {
			throw 'Size of the collection of reminders is too small for the given page count (' + this.curPage + ').';
		}

		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Reminders!')
			.setFooter(this.getFooterText(channel));

		// Return special message for empty collection
		if (this.reminders.size === 0) {
			embed.setDescription('There are no reminders for that collection.');
			return embed;
		}

		let tempText = '';

		let subList = this.reminders.simplify().getSubList(this.ITEM_LIMIT, this.curPage);
		let listIterator = 0;
		subList.forEach((reminder, index) => {
			if (channel.type !== 'dm') tempText += '(' + emojiNums[listIterator] + ')';
			tempText += reminder.getSingleLine(index);
			listIterator++;
			if (index !== subList.lastKey) tempText += '\n';
		});

		embed.setDescription(tempText);

		return embed;
	}

	build(channel) {
		let reminders = this.reminders;
		let hasNext = this.ITEM_LIMIT < reminders.size;
		let embed = this.getEmbed(channel);

		channel.send({embed : embed}).then(async message => {
			this.msg = message;
			this.startExpireTimer();
			if (hasNext) {
				await message.react(this.EMOJI_NEXT);
				await message.react(this.EMOJI_PREV);
			}
			if (channel.type !== 'dm') {
				let max = hasNext ? this.ITEM_LIMIT : reminders.size;
				for (let i = 0; i < max; i++) {
					let curEmoji = emojiNums[i];
					await message.react(curEmoji);
				}
			}

			common.addReactionListener(message, messageReaction => {
				this.resetExpireTimer();
				if (messageReaction.emoji.name === this.EMOJI_PREV) {
					this.goPrevPage();
				} else if (messageReaction.emoji.name === this.EMOJI_NEXT) {
					this.goNextPage();
				}
			}, [ this.EMOJI_PREV, this.EMOJI_NEXT ]);

			common.addReactionListener(message, (messageReaction, user, event) => {
				this.resetExpireTimer();
				let index = Object.values(emojiNums).indexOf(messageReaction.emoji.name);
				let reminder = this.getReminderOfCurList(index);
				if (event === reactionEvents.ADD) {
					reminder.addUser(user);
				} else if (event === reactionEvents.REMOVE) {
					reminder.removeUser(user);
				}
			}, Object.values(emojiNums));
		});
	}

}

module.exports = ReminderList;
