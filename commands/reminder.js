const common = require('../common.js');
const {
	Storage,
	saveData
} = common;
const Discord = require('discord.js');

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
				let regexString = suffix.match(/(.*)(?:-m (.*))/i);
				common.debug(regexString);
				let date = Date.parse(regexString[1]);
				let task = regexString[2];
				let msgLink = 'http://discordapp.com/channels/' + ((msg.channel.type === 'text') ? msg.guild.id : '@me') + '/' + msg.channel.id + '/' + msg.id;
				Storage.reminders.push({
					'user' : msg.author.id,
					'date' : date,
					'msgLink' : msgLink,
					'task' : task
				});
				common.debug(Storage.reminders);
				saveData();
				let embed = new Discord.RichEmbed()
					.setTitle('Reminder set!')
					.setDescription('I will remind you about [this message](<' + msgLink + '>) on ' + date + '.')
					.setFooter('I actually won\'t because my owner is too lazy to implement that right now.');
				msg.channel.send({embed});
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
					execute(msg, suffix) {
						for (let i = 0; i < Storage.reminders.length; i++) {
							if (Storage.reminders[i].user === msg.author.id) {
								Storage.reminders[i] = null;
							}
						}
						saveData();
					}
				},
			],
			usage : '<#>',
			description : 'Remove the reminder with list #<#>.'/*,
			execute(msg, suffix) {
				let toRemove = suffix.split(' ')[1];
			}*/
		},
		{
			name : 'list',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'List all reminders',
			execute(msg, suffix) {
				let tempReminders = [];
				for (let i = 0; i < Storage.reminders.length; i++) {
					if (Storage.reminders[i].user === msg.author.id) {
						tempReminders.push(Storage.reminders[i]);
					}
				}
				let tempText = '';
				for (let i = 0; i < tempReminders.length; i++) {
					let cur = tempReminders[i];
					tempText += '**#' + (i + 1) + '** ' + common.parseDate(cur.date);
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
	]
};