module.exports = {
	name: 'reminder',
	usage : [
		'add <time/date> [-m <message>]',
		'remove <#/all>',
		'list'
	],
	description : [
		'Add a reminder that will remind you until either <time> has passed or remind you on <date>. Optional message after token [-m].',
		'Remove the reminder with list #<#> or remove <all> reminders.',
		'List all reminders'
	],
	execute(msg, suffix) {
		if (suffix === '') {
			msg.channel.send(getHelpEmbed('reminder'));
		}
		let args = suffix.split(' ');
		let subCmd = args[0];
		if (subCmd === 'add') {
			let regexString = suffix.match(/(?:add) (.*)(?:-m (.*))/i);
			common.debugLog(regexString);
			let date = Date.parse(regexString[1]);
			let task = regexString[2];
			let msgLink = 'http://discordapp.com/channels/' + ((msg.channel.type === 'text') ? msg.guild.id : '@me') + '/' + msg.channel.id + '/' + msg.id;
			Storage.reminders.push({
				'user' : msg.author.id,
				'date' : date,
				'msgLink' : msgLink,
				'task' : task
			});
			common.debugLog(Storage.reminders);
			saveVars();
			let embed = new Discord.RichEmbed()
				.setTitle('Reminder set!')
				.setDescription('I will remind you about [this message](<' + msgLink + '>) on ' + date + '.')
				.setFooter('I actually won\'t because my owner is too lazy to implement that right now.');
			msg.channel.send({embed});
		} else if (subCmd === 'remove') {
			let toRemove = suffix.split(' ')[1];
			if (toRemove === 'all') {
				for (let i = 0; i < Storage.reminders.length; i++) {
					if (Storage.reminders[i].user === msg.author.id) {
						Storage.reminders[i] = null;
					}
				}
				saveVars();
			}
		} else if (subCmd === 'list') {
			let tempReminders = [];
			for (let i = 0; i < Storage.reminders.length; i++) {
				if (Storage.reminders[i].user === msg.author.id) {
					tempReminders.push(Storage.reminders[i]);
				}
			}
			let tempText = '';
			for (let i = 0; i < tempReminders.length; i++) {
				let cur = tempReminders[i];
				tempText += '**#' + (i + 1) + '** ' + unparseDate(cur.date);
				if (cur.task != null) {
					tempText += ' - ' + cur.task;
				}
				if (i < tempReminders.length) {
					tempText += '\n';
				}
			}
			let embed = new Discord.RichEmbed()
				.setDescription('Here are your reminders, ' + msg.author + '!\n' + tempText);
			msg.channel.send({embed});
		}
	}
};