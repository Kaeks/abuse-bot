const common = require('../common.js');
const { Discord } = common;

const reactionEvents = require('../enum/ReactionEventEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

const emojiPrev = '◀';
const emojiNext = '▶';

const emojiNums = {
	0 : '0️⃣',
	1 : '1️⃣',
	2 : '2️⃣',
	3 : '3️⃣',
	4 : '4️⃣',
	5 : '5️⃣',
	6 : '6️⃣',
	7 : '7️⃣',
	8 : '8️⃣',
	9 : '9️⃣',
	10: '🔟'
};

const ITEM_LIMIT = 5;
const ABSOLUTE_MAX_ITEM_LIMIT = Object.values(emojiNums).length;

if (ITEM_LIMIT > ABSOLUTE_MAX_ITEM_LIMIT) process.exit(1);

// ms
const LISTENING_TIME = 30 * 60 * 1000;

function getSubList(collection, page = 0) {
	let subList = new Discord.Collection();
	for (let i = page * ITEM_LIMIT; i < ITEM_LIMIT * (page + 1); i++) {
		let cur = collection.array()[i];
		if (cur === undefined) break;
		subList.set(i, cur);
	}
	return subList;
}

class ReminderList {
	id;
	reminders;
	userMsg;
	msg;
	curPage = 0;
	pages;
	expireDate;
	timer;

	constructor(userMsg, collection) {
		this.id = Discord.SnowflakeUtil.generate();
		this.reminders = collection;
		this.userMsg = userMsg;
		this.pages = Math.ceil(collection.size / ITEM_LIMIT);
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
		for (let reminderEntry of getSubList(this.reminders, this.curPage)) {
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

	send(channel) {
		let reminders = this.reminders;
		let hasNext = ITEM_LIMIT < reminders.size;
		let embed = this.getEmbed(channel);

		channel.send({embed : embed}).then(async message => {
			this.msg = message;
			this.startExpireTimer();
			if (hasNext) {
				await message.react(emojiPrev);
				await message.react(emojiNext);
			}
			if (channel.type !== 'dm') {
				let max = hasNext ? ITEM_LIMIT : reminders.size;
				for (let i = 0; i < max; i++) {
					let curEmoji = emojiNums[i];
					await message.react(curEmoji);
				}
			}

			common.addReactionListener(message, messageReaction => {
				this.resetExpireTimer();
				if (messageReaction.emoji.name === emojiPrev) {
					this.goPrevPage();
				} else if (messageReaction.emoji.name === emojiNext) {
					this.goNextPage();
				}
			}, [ emojiPrev, emojiNext ]);

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

	getEmbed(channel) {
		let user = this.userMsg.author;

		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Reminders!')
			.setAuthor(user.username, user.avatarURL);

		// Filter out people with 0 reminders
		if (this.reminders.size === 0) {
			embed.setDescription('You don\'t have any reminders.');
			return embed;
		}

		// Throw error when we are on a page that doesn't exist with the amount of reminders the user has
		// e.g. page 2 does not exist with only 10 reminders
		if (this.reminders.size < this.curPage * ITEM_LIMIT + 1) {
			throw 'Size of the collection of reminders is too small for the given page count (' + this.curPage + ').';
		}

		let tempText = '';

		let subList = getSubList(this.reminders.simplify(), this.curPage);
		let listIterator = 0;
		subList.forEach((reminder, index) => {
			tempText += emojiNums[listIterator] + reminder.getSingleLine(index);
			listIterator++;
			if (index !== subList.lastKey) tempText += '\n';
		});

		embed.setDescription(tempText);

		if (channel.type !== 'dm') {
			let userHandle = user.username + '#' + user.discriminator;
			let userString = channel.type === 'text' ?
				(this.userMsg.member.nickname || user.username) + ' (' + userHandle + ')' :
				channel.type === 'group' ? userHandle : '';

			let footerText = '';
			if (this.pages > 1) footerText += 'Page ' + (this.curPage + 1) + ' of ' + this.pages + '\n';
			footerText += 'If the reminder was issued in a DM the link won\'t work for others except for ' + userString + '.\n';
			if (channel.type !== 'dm') footerText += 'React with a number to join that reminder!';
			if (this.pages > 1) footerText += ' Use ' + emojiPrev + ' and ' + emojiNext + ' to shuffle through the list.';
			embed.setFooter(footerText);
		}

		return embed;
	}

}

module.exports = ReminderList;
