const common = require('../common');
const {
	Discord, chrono
} = common;

const Command = require('../class/Command.js');
const SubCommand = require('../class/SubCommand.js');

const Reminder = require('../class/Reminder');
const ReminderList = require('../class/ReminderList');
const UserReminderList = require('../class/UserReminderList');

const argumentValues = require('../enum/ArgumentValueEnum');
const colors = require('../enum/EmbedColorEnum');
const permissionLevels = require('../enum/PermissionLevelEnum');
const timeSpans = require('../enum/TimeSpanEnum');
const confirmationEmojis = require('../enum/ConfirmationEmojiEnum');

let commandReminderAdd = new SubCommand('add', argumentValues.REQUIRED)
	.addDoc(
		'<time/date> [-m <message]',
		'Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].'
	).setExecute((msg, suffix) => {
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
		messagePromise.then(botMsg => {
			let reminder = new Reminder(msg, date, taskString, botMsg);
			common.addReminder(reminder);
		});
		if (msg.channel.type !== 'dm') {
			messagePromise.then(message => {
				message.react(common.REMINDER_SIGNUP_EMOJI).catch(console.error);
			});
		}
	});


let commandReminderRemoveAll = new SubCommand('all', argumentValues.NONE)
	.addDoc('', 'Remove all of your reminders.')
	.setExecute(msg => {
		let user = msg.author;
		let userReminders = common.getRemindersOfUser(user);
		if (userReminders.size === 0) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('No reminders!')
				.setDescription('You are not signed up for any reminders.')
				.setFooter('But I guess you got what you wanted?');
			msg.channel.send({ embed: embed });
			return false;
		}
		// Timeout for confirmation reaction in seconds
		const CONFIRMATION_TIMEOUT = 30;
		let confirmationEmbed = new Discord.RichEmbed()
			.setColor(colors.PURPLE)
			.setTitle('Are you sure?')
			.setDescription('You are about to leave all of your (' + userReminders.size + ') reminders. Is that 👌?')
			.setFooter('React with 👌 to confirm (' + CONFIRMATION_TIMEOUT + ' seconds)');
		msg.channel.send({ embed: confirmationEmbed }).then(message => {
			message.react('👌');
			message.awaitReactions((reaction, reactor) => {
				return Object.values(confirmationEmojis).includes(reaction.emoji.name) && reactor === user
			}, {
				time : CONFIRMATION_TIMEOUT * timeSpans.SECOND,
				max : 1,
				errors : ['time']
			}).then(collected => {
				common.leaveAllReminders(user);
				let theEmoji = collected.first().emoji.name;
				let friendlyDescription = '👌 Removed you from all of your reminders.';
				let rudeDescription = 'Listen up, kid. You were supposed to react with 👌 and not '
					+ theEmoji + '. I\'ll let that slip this time and removed you from all of your reminders.';
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Removed from all reminders!')
					.setDescription(theEmoji === '👌' ? friendlyDescription : rudeDescription);
				message.edit({ embed: successEmbed });
			}).catch(collected => {
				let abortedEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Confirmation timed out!')
					.setDescription('You did not confirm your action. Process aborted.');
				message.edit({ embed: abortedEmbed }).then(editedMessage => {
					editedMessage.delete(5000);
				});
			});
		});
	});


let commandReminderRemove = new SubCommand('remove', argumentValues.REQUIRED)
	.addDoc('<#>', 'Remove the reminder with list #<#>.')
	.addSub(commandReminderRemoveAll)
	.setExecute((msg, suffix) => {
		let user = msg.author;
		let embed = new Discord.RichEmbed();
		if (isNaN(suffix)) {
			embed.setColor(colors.RED)
				.setTitle('Not a number!')
				.setDescription('<#> must be an integer.');
			msg.channel.send({embed : embed});
			return false;
		}
		if (parseInt(suffix, 10) < 0) {
			embed.setColor(colors.RED)
				.setTitle('Below 0!')
				.setDescription('<#> must be 0 or greater.');
			msg.channel.send({embed : embed});
			return false;
		}
		let reminderIndex = parseInt(suffix, 10);
		let simpleReminders = common.getRemindersOfUser(user).simplify();
		let reminder;
		if (!simpleReminders.has(reminderIndex)) {
			embed.setColor(colors.RED)
				.setTitle('Not found!')
				.setDescription('You don\'t have a reminder #' + reminderIndex + '.');
			msg.channel.send({embed : embed});
			return false;
		}
		reminder = simpleReminders.get(reminderIndex);

		// Timeout for confirmation reaction in seconds
		const CONFIRMATION_TIMEOUT = 30;

		let reminderString = '#' + reminderIndex + (reminder.task.length > 0 ? ' (' + reminder.task + ')' : '') + ' set for ' + reminder.date;

		let confirmationEmbed = new Discord.RichEmbed()
			.setColor(colors.PURPLE)
			.setTitle('Are you sure?')
			.setDescription('You are about to leave reminder ' + reminderString + '. Is that 👌?')
			.setFooter('React with 👌 to confirm (' + CONFIRMATION_TIMEOUT + ' seconds)');
		msg.channel.send({ embed: confirmationEmbed }).then(message => {
			message.react('👌');
			message.awaitReactions((reaction, reactor) => {
				return Object.values(confirmationEmojis).includes(reaction.emoji.name) && reactor === user
			}, {
				time : CONFIRMATION_TIMEOUT * timeSpans.SECOND,
				max : 1,
				errors : ['time']
			}).then(collected => {
				if (!reminder.removeUser(user)) {
					embed.setColor(colors.RED)
						.setTitle('Oops!')
						.setDescription('Something went wrong when trying to remove that reminder from your list.');
					msg.channel.send({embed : embed});
					return false;
				}
				let theEmoji = collected.first().emoji.name;
				let friendlyDescription = '👌 Removed you from reminder ' + reminderString + '.';
				let rudeDescription = 'Listen up, kid. You were supposed to react with 👌 and not '
					+ theEmoji + '.' + '\n'
					+ 'I\'ll let that slip this time and removed you from reminder ' + reminderString + '.';
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Removed from reminder!')
					.setDescription(theEmoji === '👌' ? friendlyDescription : rudeDescription);
				message.edit({ embed: successEmbed });
			}).catch(collected => {
				let abortedEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Confirmation timed out!')
					.setDescription('You did not confirm your action. Process aborted.');
				message.edit({ embed: abortedEmbed }).then(editedMessage => {
					editedMessage.delete(5000);
				});
			});
		});
	});


let commandReminderList = new SubCommand('list', argumentValues.NONE)
	.addDoc('', 'List all of your reminders.')
	.setExecute(async msg => {
		let user = msg.author;
		let reminderList = new UserReminderList(msg, user);
		await reminderList.send(msg.channel);
	});

let commandReminderDisplayAll = new SubCommand('all', argumentValues.NONE)
	.addDoc('', 'Display all reminders of all users.')
	.setExecute((msg, suffix) => {

	});

let commandReminderDisplay = new SubCommand('display', argumentValues.REQUIRED, permissionLevels.BOT_SUPERUSER)
	.addDoc('<user>', 'Display all reminders of a user.')
	.addSub(commandReminderDisplayAll)
	.setExecute((msg, suffix) => {

	});

let commandReminder =
	new Command('reminder', argumentValues.NULL)
		.addSub(commandReminderAdd)
		.addSub(commandReminderRemove)
		.addSub(commandReminderList)
		.addSub(commandReminderDisplay);

module.exports = commandReminder;
