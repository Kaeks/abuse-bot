const common = require('../common');
const { Discord } = common;

const enums = require('../enum');

const { reactionEvents, colors, emojiNums } = enums;

const MessageHandler = require('./MessageHandler');

// ms
const LISTENING_TIME = 30 * 60 * 1000;

class ReminderList extends MessageHandler {
	reminders;
	page;
	pages;
	expireDate;
	timer;

	ITEM_LIMIT = 5;
	EMOJI_PREV = '◀';
	EMOJI_NEXT = '▶';

	constructor(channel, collection, page = 0) {
		super(channel);
		this.reminders = collection;
		this.page = page;
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
		this.message.delete().catch(console.error);
		common.debug('Deleted reminder list with id ' + this.id + '.');
	}

	getReminderOfCurList(num) {
		let iterator = 0;
		for (let reminderEntry of this.reminders.getSubList(this.ITEM_LIMIT, this.page)) {
			if (iterator === num) {
				return reminderEntry[1];
			}
			iterator++;
		}
	}

	changePage(page) {
		if (page < 0) throw 'Attempted to access page smaller than 0.';
		if (page + 1 > this.pages) throw 'Page ' + page + ' doesn\'t exist for reminderList ' + this.id + '.';
		this.page = page;
		this.updateMessage();
	}

	goNextPage() {
		if (this.page + 1 >= this.pages) return false;
		this.changePage(this.page + 1);
	}

	goPrevPage() {
		if (this.page === 0) return false;
		this.changePage(this.page - 1);
	}

	getPageText() {
		return this.pages > 1 ? 'Page ' + (this.page + 1) + ' of ' + this.pages : '';
	}

	getFooterText() {
		let footerText = '';
		if (this.channel.type !== 'dm') footerText += 'React with a number to join or leave that reminder!' + '\n';
		if (this.pages > 1) {
			footerText += 'Use ' + this.EMOJI_PREV + ' and ' + this.EMOJI_NEXT + ' to shuffle through the list.' + '\n';
			footerText += this.getPageText() + '\n';
		}
		return footerText;
	}

	async getEmbed() {
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Reminders!');

		// Return special message for empty collection
		if (this.reminders.size === 0) {
			embed.setDescription('There are no reminders for that collection.');
			return embed;
		}

		embed.setFooter(this.getFooterText());

		let subList = this.reminders.simplify().getSubList(this.ITEM_LIMIT, this.page);
		let listIterator = 0;
		let tempText = '';
		subList.forEach((reminder, index) => {
			if (this.channel.type !== 'dm') tempText += '(' + emojiNums[listIterator] + ')';
			tempText += reminder.getSingleLine(index);
			listIterator++;
			if (index !== subList.lastKey) tempText += '\n';
		});

		embed.setDescription(tempText);

		return embed;
	}

	/**
	 * Builds the reminder list
	 */
	async build() {
		await super.build();
		let hasNext = this.ITEM_LIMIT < this.reminders.size;
		let initialEmbed = await this.getEmbed(this.channel);

		this.channel.send({ embed: initialEmbed }).then(async message => {
			this.message = message;
			this.startExpireTimer();

			if (hasNext) {
				await message.react(this.EMOJI_PREV);
				await message.react(this.EMOJI_NEXT);
			}

			if (this.channel.type !== 'dm') {
				let max = hasNext ? this.ITEM_LIMIT : this.reminders.size;
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
