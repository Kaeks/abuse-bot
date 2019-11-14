const common = require('../common.js');
const {
	Discord, chrono,
	addReminder, leaveReminder, leaveAllReminders
} = common;

module.exports = {
	name : 'reminder',
	args : common.argumentValues.NULL,
	sub : [
		{
			name : 'add',
			args : common.argumentValues.REQUIRED,
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
					embed.setColor(common.colors.RED)
						.setTitle('Missing task!')
						.setDescription('You provided the `-m` option, but it\'s missing a task.');
					msg.channel.send({ embed: embed })
						.then(message => message.delete(5000));
					return false;
				}
				
				let date = chrono.parseDate(dateString, new Date());
				common.debug('Parsed date: ' + date);

				if (date == null) {
					embed.setColor(common.colors.RED)
						.setTitle('Invalid time/date input!')
						.setDescription('`' + dateString + '` could not be converted into a usable timestamp.');
					msg.channel.send({ embed: embed })
						.then(message => message.delete(5000));
					return false;
				}
				let msgLink = msg.getLink();
				let tempText = 'I will remind you about [this message](<' + msgLink + '>) on ' + date + '.' +
				(taskString.length > 0 ? '\n> ' + taskString : '');
				embed.setColor(common.colors.GREEN)
					.setTitle('Reminder set!')
					.setDescription(tempText);
				if (msg.channel.type !== 'dm') {
					embed.setFooter('React to this message with 🙋 if you would also like to be reminded');
				}
				let messagePromise = msg.channel.send({ embed: embed });
				messagePromise.then(botMsg => addReminder(msg, date, taskString, botMsg));
				if (msg.channel.type !== 'dm') {
					messagePromise.then(message => message.react('🙋'));
				}
			}
		},
		{
			name : 'remove',
			args : common.argumentValues.REQUIRED,
			sub : [
				{
					name : 'all',
					args : common.argumentValues.NONE,
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
									.setColor(common.colors.GREEN)
									.setTitle('Left reminder!')
									.setDescription(
										msg.author + ' you will no longer be reminded about [this message](<' + msgLink + '>) ' +
										(reminder.task.length > 0 ? '\nwith the task\n> ' + reminder.task + '\n' : '') +
										'on ' + reminder.date + '.'
									);
								msg.channel.send({ embed: embed });
							} else {
								let embed = new Discord.RichEmbed()
									.setColor(common.colors.RED)
									.setTitle('Oops!')
									.setDescription('Something went wrong when trying to remove that reminder from your list.');
								msg.channel.send({ embed: embed });
								return false;
							}
						} else {
							let embed = new Discord.RichEmbed()
								.setColor(common.colors.RED)
								.setTitle('Not found!')
								.setDescription('You don\'t have a reminder #' + reminderIndex + '.');
							msg.channel.send({ embed: embed });
							return false;
						}
					} else {
						let embed = new Discord.RichEmbed()
							.setColor(common.colors.RED)
							.setTitle('Below 0!')
							.setDescription('<#> must be 0 or greater.');
						msg.channel.send({ embed: embed });
						return false;
					}
				} else {
					let embed = new Discord.RichEmbed()
						.setColor(common.colors.RED)
						.setTitle('Not a number!')
						.setDescription('<#> must be an integer.');
					msg.channel.send({ embed: embed });
					return false;
				}
			}
		},
		{
			name : 'list',
			args : common.argumentValues.NONE,
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
}

function getSingleReminderString(index, reminder) {
	let realDate = new Date(reminder.date);
	let indexString = '**#' + index + '**';
	let linkString = '[' + common.parseDate(realDate) + '](<' + reminder.msgLink + '>)';
	let taskString = reminder.task.length > 0 ? '\n> ' + reminder.task : '';
	return indexString + ' ' + linkString + taskString;

}

function getSubList(collection, page = 0) {
	let subList = new Discord.Collection();
	for (let i = page * ITEM_LIMIT; i < ITEM_LIMIT * (page + 1) - 1; i++) {
		let cur = collection[i];
		console.log(cur);
		if (cur === undefined) break;
		subList.set(cur[0], cur[1]);
	}
	return subList;
}

function sendReminderList(msg, user, page = 0) {

	let simpleReminders = common.getRemindersOfUser(user).simplify();
	
	// Filter out people with 0 reminders
	if (simpleReminders.size === 0) {
		embed.setDescription('You don\'t have any reminders.');
		msg.channel.send({embed : embed});
		return false;
	}

	// Throw error when we are on a page that doesn't exist with the amount of reminders the user has
	// e.g. page 2 does not exist with only 10 reminders
	if (simpleReminders.size < page * ITEM_LIMIT + 1) {
		throw 'Size of the collection of reminders is too small for the given page count (' + page + ').';
	}

	let hasPrev = page > 0;
	let hasNext = (page + 1) * ITEM_LIMIT < simpleReminders.size;

	let embed = new Discord.RichEmbed()
		.setColor(common.colors.GREEN)
		.setTitle('Reminders!')
		.setAuthor(user.username, user.avatarURL);

	let tempText = '';

	let subList = getSubList(simpleReminders, page);
	subList.forEach((reminder, key) => {
		tempText += getSingleReminderString(key, reminder);
		if (key !== subList.lastKey) tempText += '\n';
	});

	embed.setDescription(tempText);

	if (msg.channel.type !== 'dm') {
		let userHandle = user.username + '#' + discriminator;
		let userString = msg.channel.type === 'text' ?
			(msg.member.nickname | user.username) + ' (' + userHandle + ')' :
			msg.channel.type === 'group' ? userHandle : '';
		embed.setFooter(
			'Click on the individual reminders to scroll to the message they refer to.' +
			'\nIf the reminder was issued in a DM the link won\'t work for others except for ' + userString + '.');
	}

	let messagePromise = msg.channel.send({embed : embed}).then(message => {
		if (hasPrev) {
			message.react('🔼');
		}
		if (hasNext) {
			message.react('🔽');
		}
		if (msg.channel.type !== 'dm') {

		}
	});
	return true;
}
