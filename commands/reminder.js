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

let commandReminderAddExecute = (msg, suffix) => {
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
};

let commandReminderRemoveExecute = (msg, suffix) => {
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
	let simpleReminders = common.getRemindersOfUser(msg.author).simplify();
	common.debug(simpleReminders);
	let reminder;
	if (!simpleReminders.has(reminderIndex)) {
		embed.setColor(colors.RED)
			.setTitle('Not found!')
			.setDescription('You don\'t have a reminder #' + reminderIndex + '.');
		msg.channel.send({embed : embed});
		return false;
	}
	reminder = simpleReminders.get(reminderIndex);
	if (!reminder.removeUser(msg.author)) {
		embed.setColor(colors.RED)
			.setTitle('Oops!')
			.setDescription('Something went wrong when trying to remove that reminder from your list.');
		msg.channel.send({embed : embed});
		return false;
	}
	let msgLink = reminder.userMsg.getLink();
	embed.setColor(colors.GREEN)
		.setTitle('Left reminder!')
		.setDescription(msg.author + ' you will no longer be reminded about [this message](<' + msgLink + '>) ' + (reminder.task.length > 0 ? '\nwith the task\n> ' + reminder.task + '\n' : '') + 'on ' + reminder.date + '.');
	msg.channel.send({embed : embed});
};

let commandReminderRemoveAllExecute = msg => common.leaveAllReminders(msg.author);

let commandReminderList = async msg => {
	let user = msg.author;
	let reminderList = new UserReminderList(msg, user);
	await reminderList.send(msg.channel);
};

let commandReminderDisplay = (msg, suffix) => {

};

let commandReminderDisplayAll = (msg, suffix) => {

};

//TODO find way to execute higher-level (sub-)commands before nested sub-commands to fix error of missing parent
//TODO or do permissionLevel check after everything is done

let commandReminder =
	new Command('reminder', argumentValues.NULL)
		.addSub(new SubCommand('add', argumentValues.REQUIRED)
			.addDoc(
				'<time/date> [-m <message]',
				'Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].'
			).setExecute(commandReminderAddExecute)
		)
		.addSub(new SubCommand('remove', argumentValues.REQUIRED)
			.addDoc('<#>', 'Remove the reminder with list #<#>.')
			.setExecute(commandReminderRemoveExecute)
			.addSub(new SubCommand('all', argumentValues.NONE)
				.addDoc('', 'Remove all of your reminders.')
				.setExecute(commandReminderRemoveAllExecute)
			)
		)
		.addSub(new SubCommand('list', argumentValues.NONE)
			.addDoc('', 'List all of your reminders.')
			.setExecute(commandReminderList)
		)
		.addSub(new SubCommand('display', argumentValues.REQUIRED, permissionLevels.BOT_SUPERUSER)
			.addDoc('<user>', 'Display all reminders of a user.')
			.setExecute(commandReminderDisplay)
			.addSub(new SubCommand('all', argumentValues.NONE)
				.addDoc('', 'Display all reminders of all users.')
				.setExecute(commandReminderDisplayAll)
			)
		);

module.exports = commandReminder;
