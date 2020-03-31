const Discord = require.main.require('./discordjs_amends');
const chrono = require('chrono-node');

const classes = require.main.require('./class');
const {
	Command, SubCommand, Reminder, handlers
} = classes;

const { ReminderListHandler, UserReminderListHandler, ConfirmationMessageHandler } = handlers;

const enums = require.main.require('./enum');
const { argumentValues, colors, permissionLevels } = enums;

const REMINDER_SIGNUP_EMOJI = '🙋';

let commandReminderAdd = new SubCommand('add', argumentValues.REQUIRED)
	.addDoc(
		'<time|date> [-m <message>]',
		'Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].'
	).setDelete(false)
	.setExecute((msg, suffix) => {
		let client = msg.client;
		let channel = msg.channel;
		let reminderHandler = client.reminderHandler;

		let optionString = ' -m';
		let mPosition = suffix.indexOf(optionString);

		client.logger.debug('mPosition: ' + mPosition);

		let dateString, taskString;

		if (mPosition > -1) {
			dateString = suffix.substring(0, mPosition);
			taskString = suffix.substring(mPosition + 1 + optionString.length);
		} else {
			dateString = suffix;
			taskString = '';
		}

		client.logger.debug('dateString: ' + dateString);
		client.logger.debug('taskString: ' + taskString);

		let embed = new Discord.RichEmbed();

		// optionString has been found within the suffix, but nothing follows
		if (mPosition > -1 && taskString.length === 0) {
			embed.setColor(colors.RED)
				.setTitle('Missing task!')
				.setDescription('You provided the `-m` option, but it\'s missing a task.');
			channel.send({ embed: embed })
				.then(message => message.delete(5000));
			return false;
		}

		let date = chrono.parseDate(dateString, new Date());
		client.logger.debug('Parsed date: ' + date);

		if (date == null) {
			embed.setColor(colors.RED)
				.setTitle('Invalid time/date input!')
				.setDescription('`' + dateString + '` could not be converted into a usable timestamp.');
			channel.send({ embed: embed })
				.then(message => message.delete(5000));
			return false;
		};
		let msgLink = msg.getLink();
		let tempText = 'I will remind you about [this message](<' + msgLink + '>) on ' + date + '.' +
			(taskString.length > 0 ? '\n> ' + taskString : '');
		embed.setColor(colors.GREEN)
			.setTitle('Reminder set!')
			.setDescription(tempText);
		if (channel.type !== 'dm') {
			embed.setFooter('React to this message with ' + REMINDER_SIGNUP_EMOJI + ' if you would also like to be reminded');
		}
		let messagePromise = channel.send({ embed: embed });
		messagePromise.then(botMsg => {
			let reminder = new Reminder(msg, date, taskString, botMsg);
			reminderHandler.add(reminder);
			reminderHandler.start(reminder);
		});

		if (channel.type !== 'dm') {
			messagePromise.then(message => {
				message.react(REMINDER_SIGNUP_EMOJI).catch(console.error);
			});
		}
	});


let commandReminderRemoveAll = new SubCommand('all', argumentValues.NONE)
	.addDoc('', 'Remove all of your reminders.')
	.setExecute(msg => {
		let client = msg.client;
		let reminderHandler = client.reminderHandler;

		let user = msg.author;
		let userReminders = reminderHandler.getRemindersOfUser(user);
		if (userReminders.size === 0) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('No reminders!')
				.setDescription('You are not signed up for any reminders.')
				.setFooter('But I guess you got what you wanted?');
			msg.channel.send({ embed: embed });
			return false;
		}

		let confirmationHandler = new ConfirmationMessageHandler(client, msg.channel, () => {
			client.reminderHandler.leaveAll(user);
		}, {
			users : [ user ],
			initialDesc : 'You are about to leave all of your (' + userReminders.size + ') reminders.',
			initialTitle : 'Are you sure?',
			acceptDesc : 'Removed you from all of your reminders.',
			acceptTitle : 'Removed from all reminders!',
			altAcceptDesc : 'removed you from all of your reminders.'
		});
		confirmationHandler.build();
	});


let commandReminderRemove = new SubCommand('remove', argumentValues.REQUIRED)
	.addDoc('<#>', 'Remove the reminder with list #<#>.')
	.addSub(commandReminderRemoveAll)
	.setExecute((msg, suffix) => {
		let client = msg.client;
		let reminderHandler = client.reminderHandler;

		let user = msg.author;
		let embed = new Discord.RichEmbed();
		if (isNaN(suffix)) {
			embed.setColor(colors.RED)
				.setTitle('Not a number!')
				.setDescription('<#> must be an integer.');
			msg.channel.send({ embed : embed });
			return false;
		}
		if (parseInt(suffix, 10) < 0) {
			embed.setColor(colors.RED)
				.setTitle('Below 0!')
				.setDescription('<#> must be 0 or greater.');
			msg.channel.send({ embed : embed });
			return false;
		}
		let reminderIndex = parseInt(suffix, 10);
		let simpleReminders = reminderHandler.getRemindersOfUser(user).simplify();
		let reminder;
		if (!simpleReminders.has(reminderIndex)) {
			embed.setColor(colors.RED)
				.setTitle('Not found!')
				.setDescription('You don\'t have a reminder #' + reminderIndex + '.');
			msg.channel.send({ embed : embed });
			return false;
		}
		reminder = simpleReminders.get(reminderIndex);

		let reminderString = '#' + reminderIndex + (reminder.task.length > 0 ? ' (' + reminder.task + ')' : '') + ' set for ' + reminder.date;

		let confirmationHandler = new ConfirmationMessageHandler(client, msg.channel, () => {
			if (!reminder.removeUser(user)) {
				embed.setColor(colors.RED)
					.setTitle('Oops!')
					.setDescription('Something went wrong when trying to remove that reminder from your list.');
				msg.channel.send({ embed : embed });
				return false;
			}
		}, {
			users : [ user ],
			initialDesc : 'You are about to leave reminder ' + reminderString + '.',
			initialTitle : 'Are you sure?',
			acceptDesc : 'Removed you from reminder ' + reminderString + '.',
			acceptTitle : 'Removed from reminder!',
			altAcceptDesc : 'removed you from reminder ' + reminderString + '.'
		});
		confirmationHandler.build();
	});


let commandReminderListHandler = new SubCommand('list', argumentValues.NONE)
	.addDoc('', 'List all of your reminders.')
	.setExecute(async msg => {
		let user = msg.author;
		let ReminderListHandler = new UserReminderListHandler(msg.client, msg.channel, user, user);
		await ReminderListHandler.build(msg.channel);
	});

let commandReminderDisplayAll = new SubCommand('all', argumentValues.NONE)
	.addDoc('', 'Display all reminders of all users.')
	.setExecute(async msg => {
		let client = msg.client;
		let reminderListHandler = new ReminderListHandler(msg.client, msg.channel, client.reminderHandler.reminders);
		await reminderListHandler.build(await msg.author.getDmChannel());
	});

let commandReminderDisplay = new SubCommand('display', argumentValues.REQUIRED, permissionLevels.BOT_SUPERUSER)
	.addDoc('<user>', 'Display all reminders of a user.')
	.addSub(commandReminderDisplayAll)
	.setExecute(async (msg, suffix) => {
		let client = msg.client;
		let users = client.getUsers();
		let mentions = msg.mentions;
		let user;
		if (users.has(suffix)) user = users.get(suffix);
		else if (mentions.users.size > 0) user = msg.mentions.users.first();
		else throw 'WRONG';
		let author = msg.author;
		let reminderListHandler = new UserReminderListHandler(client, msg.channel, user, author);
		await reminderListHandler.build(await author.getDmChannel());
	});

let commandReminder = new Command('reminder', argumentValues.NULL)
	.addSub(commandReminderAdd)
	.addSub(commandReminderRemove)
	.addSub(commandReminderListHandler)
	.addSub(commandReminderDisplay);

module.exports = commandReminder;
