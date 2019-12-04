const common = require('../common');
const { Discord } = common;

const reactionEvents = require('../enum/ReactionEventEnum');
const colors = require('../enum/EmbedColorEnum');
const emojiNums = require('../enum/EmojiNumEnum');

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
		if (channel.type !== 'dm') footerText += 'React with a number to join or leave that reminder!' + '\n';
		if (this.pages > 1) {
			footerText += 'Use ' + this.EMOJI_PREV + ' and ' + this.EMOJI_NEXT + ' to shuffle through the list.' + '\n';
			footerText += this.getPageText() + '\n';
		}
		return footerText;
	}

	getEmbed(channel) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Reminders!');

		// Return special message for empty collection
		if (this.reminders.size === 0) {
			embed.setDescription('There are no reminders for that collection.');
			return embed;
		}

		embed.setFooter(this.getFooterText(channel));

		let subList = this.reminders.simplify().getSubList(this.ITEM_LIMIT, this.curPage);
		let listIterator = 0;
		let tempText = '';
		subList.forEach((reminder, index) => {
			if (channel.type !== 'dm') tempText += '(' + emojiNums[listIterator] + ')';
			tempText += reminder.getSingleLine(index);
			listIterator++;
			if (index !== subList.lastKey) tempText += '\n';
		});

		embed.setDescription(tempText);

		return embed;
	}

	/**
	 * Builds the reminder list in a specified channel
	 * @param channel
	 */
	build(channel) {
		let reminders = this.reminders;
		let hasNext = this.ITEM_LIMIT < reminders.size;
		let embed = this.getEmbed(channel);

		channel.send({ embed: embed }).then(async message => {
			this.msg = message;
			this.startExpireTimer();

			if (hasNext) {
				await message.react(this.EMOJI_PREV);
				await message.react(this.EMOJI_NEXT);
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

			common.addReactionListener(message, (messageReaction, user) => {
				this.resetExpireTimer();
				let index = Object.values(emojiNums).indexOf(messageReaction.emoji.name);
				let reminder = this.getReminderOfCurList(index);
				let newStatus = reminder.toggleUser(user);
				let reminderToggleEmbed = new Discord.RichEmbed()
					.setColor(colors.PRESTIGE)
					.setTitle((newStatus ? 'Joined' : 'Left') + ' reminder!')
					.setDescription(
						'I will ' +
						(newStatus ? 'now' : 'no longer') +
						' remind you ' +
						(reminder.task.length > 0 ? 'about\n> ' + reminder.task + '\n' : '') +
						'on ' + reminder.date + '.'
					);
				user.sendDm({ embed: reminderToggleEmbed });
			}, Object.values(emojiNums));
		});
	}

}

module.exports = ReminderList;
