const common = require('../common.js');
const {
	Discord, chrono,
	addReminder, leaveReminder, leaveAllReminders
} = common;
const argumentValues = require('../enum/ArgumentValueEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

module.exports = {
	name : 'reminder',
	args : argumentValues.NULL,
	sub : [
		{
			name : 'add',
			args : argumentValues.REQUIRED,
			usage : '<time/date> [-m <message]',
			description : 'Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].',
			execute(msg, suffix) {				
				let optionString = ' -m';
				let mPosition = suffix.indexOf(optionString);

				common.debug('mPosition: ' + mPosition);

				let dateString = mPosition > -1 ? suffix.substring(0, mPosition) : suffix;
				let taskString = mPosition > -1 ? suffix.substring(mPosition + 1 + optionString.length) : '';

				common.debug('dateString: ' + dateString);
				common.debug('taskString: ' + taskString);

				let embed = new Discord.RichEmbed();

				// optionString has been found within the suffix, but nothing follows
				if (mPosition > -1 && taskString.length === 0) {
					embed.setColor(colors.RED)
						.setTitle('Missing task!')
						.setDescription('You provided the `-m` option, but it\'s missing a task.');
					msg.channel.send({ embed: embed })
						.then(message => message.delete(5000));
					return false;
				}
				
				let date = chrono.parseDate(dateString, new Date());
				common.debug('Parsed date: ' + date);

				if (date == null) {
					embed.setColor(colors.RED)
						.setTitle('Invalid time/date input!')
						.setDescription('`' + dateString + '` could not be converted into a usable timestamp.');
					msg.channel.send({ embed: embed })
						.then(message => message.delete(5000));
					return false;
				}
				let msgLink = msg.getLink();
				let tempText = 'I will remind you about [this message](<' + msgLink + '>) on ' + date + '.' +
				(taskString.length > 0 ? '\n> ' + taskString : '');
				embed.setColor(colors.GREEN)
					.setTitle('Reminder set!')
					.setDescription(tempText);
				if (msg.channel.type !== 'dm') {
					embed.setFooter('React to this message with ' + common.REMINDER_SIGNUP_EMOJI + ' if you would also like to be reminded');
				}
				let messagePromise = msg.channel.send({ embed: embed });
				messagePromise.then(botMsg => addReminder(msg, date, taskString, botMsg));
				if (msg.channel.type !== 'dm') {
					messagePromise.then(message => {
						message.react(common.REMINDER_SIGNUP_EMOJI);
					});
				}
			}
		},
		{
			name : 'remove',
			args : argumentValues.REQUIRED,
			sub : [
				{
					name : 'all',
					args : argumentValues.NONE,
					usage : '',
					description : 'Remove all of your reminders.',
					execute(msg) {
						leaveAllReminders(msg.author);
					}
				},
			],
			usage : '<#>',
			description : 'Remove the reminder with list #<#>.',
			execute(msg, suffix) {
				if (!isNaN(suffix)) {
					if (parseInt(suffix, 10) >= 0 ) {
						let reminderIndex = parseInt(suffix, 10);
						let simpleReminders = common.getRemindersOfUser(msg.author).simplify();
						common.debug(simpleReminders);
						let reminder;
						if (simpleReminders.has(reminderIndex)) {
							reminder = simpleReminders.get(reminderIndex);
							if (leaveReminder(msg.author, reminder.id)) {
								let msgLink = reminder.msgLink;
								let embed = new Discord.RichEmbed()
									.setColor(colors.GREEN)
									.setTitle('Left reminder!')
									.setDescription(
										msg.author + ' you will no longer be reminded about [this message](<' + msgLink + '>) ' +
										(reminder.task.length > 0 ? '\nwith the task\n> ' + reminder.task + '\n' : '') +
										'on ' + reminder.date + '.'
									);
								msg.channel.send({ embed: embed });
							} else {
								let embed = new Discord.RichEmbed()
									.setColor(colors.RED)
									.setTitle('Oops!')
									.setDescription('Something went wrong when trying to remove that reminder from your list.');
								msg.channel.send({ embed: embed });
								return false;
							}
						} else {
							let embed = new Discord.RichEmbed()
								.setColor(colors.RED)
								.setTitle('Not found!')
								.setDescription('You don\'t have a reminder #' + reminderIndex + '.');
							msg.channel.send({ embed: embed });
							return false;
						}
					} else {
						let embed = new Discord.RichEmbed()
							.setColor(colors.RED)
							.setTitle('Below 0!')
							.setDescription('<#> must be 0 or greater.');
						msg.channel.send({ embed: embed });
						return false;
					}
				} else {
					let embed = new Discord.RichEmbed()
						.setColor(colors.RED)
						.setTitle('Not a number!')
						.setDescription('<#> must be an integer.');
					msg.channel.send({ embed: embed });
					return false;
				}
			}
		},
		{
			name : 'list',
			args : argumentValues.NONE,
			usage : '',
			description : 'List all reminders',
			execute(msg) {
				let user = msg.author;
				sendReminderList(msg, user);
			}
		}
	]
};

const ITEM_LIMIT = 10;

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

/* Reminder lists in this session
 * 	<Snowflake, {
 * 		id : Snowflake,
 *		msg : Discord.Message,
 *		pages : Number,
 * 		curPage : Number,
 * 		expire : Date,
 * 		timer : Timeout
 * 	}>
 */
let reminderLists = new Discord.Collection();

function getSingleReminderString(index, reminder) {
	let realDate = new Date(reminder.date);
	let indexString = '**#' + index + '**';
	let linkString = '[' + common.parseDate(realDate) + '](<' + reminder.msgLink + '>)';
	let taskString = reminder.task.length > 0 ? '\n> ' + reminder.task : '';
	return indexString + ' ' + linkString + taskString;
}

function getSubList(collection, page = 0) {
	let subList = new Discord.Collection();
	for (let i = page * ITEM_LIMIT; i < ITEM_LIMIT * (page + 1); i++) {
		let cur = collection.array()[i];
		if (cur === undefined) break;
		subList.set(cur.id, cur);
	}
	return subList;
}

// ms
const LISTENING_TIME = 30 * 60 * 1000;

function addReminderList(msg, pages) {
	let id = Discord.SnowflakeUtil.generate();
	let expire = new Date(new Date() + LISTENING_TIME);
	let reminderList = {
		id : id,
		msg : msg,
		pages : pages,
		curPage : 0,
		expire : expire,
		timer : undefined
	};
	startExpireTimer(reminderList);
	common.addReactionListener(msg, (messageReaction, user, event) => {
		resetExpireTimer(reminderList);
		if (messageReaction.emoji.name === emojiPrev) {
			goPrevReminderListPage(reminderList);
		} else if (messageReaction.emoji.name === emojiNext) {
			goNextReminderListPage(reminderList);
		}
	}, [ emojiPrev, emojiNext ]);
	common.addReactionListener(msg, (messageReaction, user, event) => {
		resetExpireTimer(reminderList);
		let index = emojiNums.indexOf(messageReaction.emoji.name);
	}, emojiNums);
	reminderLists.set(id, reminderList);
}

function deleteReminderList(reminderList) {
	stopExpireTimer(reminderList);
	reminderLists.delete(reminderList.id)
}

function startExpireTimer(reminderList) {
	let diff = reminderList.expire - new Date();
	reminderList.timer = setTimeout(function() {
		deleteReminderList(reminderList);
	}, diff);
}

function stopExpireTimer(reminderList) {
	clearTimeout(reminderList.timer);
	reminderList.timer = undefined;
	reminderLists.set(reminderList.id, reminderList);
}

function resetExpireTimer(reminderList) {
	stopExpireTimer(reminderList);
	startExpireTimer(reminderList);
}

function updateReminderListMessage(reminderList) {
	let message  = reminderList.msg;
	let updatedEmbed = getReminderListEmbed(message, message.author, reminderList.page);
	message.edit(updatedEmbed);
}

function changeReminderListPage(reminderList, page) {
	if (page < 0) throw 'Attempted to access page smaller than 0.';
	if (page + 1 > reminderList.pages) throw 'Page ' + page + ' doesn\'t exist for reminderList ' + reminderList.id + '.';
	reminderList.page = page;
	updateReminderListMessage(reminderList);
}

function goNextReminderListPage(reminderList) {
	let cur = reminderList.page;
	if (cur + 1 >= reminderList.pages) return false;
	changeReminderListPage(reminderList, cur + 1);
}

function goPrevReminderListPage(reminderList) {
	let cur = reminderList.page;
	if (cur === 0) return false;
	changeReminderListPage(reminderList, cur - 1);
}

function sendReminderList(msg, user) {

	let reminders = common.getRemindersOfUser(user);

	let hasNext = ITEM_LIMIT < reminders.size;

	let pages = Math.ceil(reminders.size / ITEM_LIMIT);

	let embed = getReminderListEmbed(msg, user, 0);

	msg.channel.send({embed : embed}).then(async message => {
		if (hasNext) {
			await message.react(emojiPrev);
			await message.react(emojiNext);
		}
		if (msg.channel.type !== 'dm') {
			let max = hasNext ? ITEM_LIMIT : reminders.size;
			for (let i = 0; i < max; i++) {
				let curEmoji = emojiNums[i];
				await message.react(curEmoji);
			}
		}
		addReminderList(message, pages);
	});
}

function getReminderListEmbed(msg, user, page = 0) {

	let reminders = common.getRemindersOfUser(user);

	let embed = new Discord.RichEmbed()
		.setColor(colors.GREEN)
		.setTitle('Reminders!')
		.setAuthor(user.username, user.avatarURL);
	
	// Filter out people with 0 reminders
	if (reminders.size === 0) {
		embed.setDescription('You don\'t have any reminders.');
		return embed;
	}

	// Throw error when we are on a page that doesn't exist with the amount of reminders the user has
	// e.g. page 2 does not exist with only 10 reminders
	if (reminders.size < page * ITEM_LIMIT + 1) {
		throw 'Size of the collection of reminders is too small for the given page count (' + page + ').';
	}

	let hasNext = (page + 1) * ITEM_LIMIT < reminders.size;

	let tempText = '';

	let subList = getSubList(reminders, page);
	let listIterator = 0;
	subList.forEach((reminder, key) => {
		tempText += getSingleReminderString(listIterator, reminder);
		listIterator++;
		if (key !== subList.lastKey) tempText += '\n';
	});

	embed.setDescription(tempText);

	if (msg.channel.type !== 'dm') {
		let userHandle = user.username + '#' + user.discriminator;
		let userString = msg.channel.type === 'text' ?
			(msg.member.nickname || user.username) + ' (' + userHandle + ')' :
			msg.channel.type === 'group' ? userHandle : '';

		let footerText = 'If the reminder was issued in a DM the link won\'t work for others except for ' + userString + '.\n';
		if (msg.channel.type !== 'dm') {
			footerText += 'React with a number to join that reminder!'
		}
		if (hasNext) {
			footerText += ' Use ' + emojiPrev + ' and ' + emojiNext + ' to shuffle through the list.';
		}
		embed.setFooter(footerText);
	}

	return embed;
}
