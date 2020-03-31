const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const ReminderListHandler = require.main.require('./class/handlers/ReminderListHandler');

class UserReminderListHandler extends ReminderListHandler {
	
	user;
	issuer;

	constructor(client, channel, user, issuer) {
		super(client, channel, client.reminderHandler.getRemindersOfUser(user));
		this.user = user;
		this.issuer = issuer;
	}

	getFooterText(channel) {
		let footerText = '';
		if (this.channel.type !== 'dm' || this.issuer !== this.user) {
			let userHandle = this.user.getHandle();
			footerText += 'If the reminder was issued in a DM the link won\'t work for others except for ' + userHandle + '.\n'
		}
		footerText += super.getFooterText();
		return footerText;
	}

	async getEmbed() {
		let embed = await super.getEmbed();
		embed.setAuthor(this.user.username, this.user.avatarURL);

		// Return special message for empty collection
		if (this.reminders.size === 0) {
			if (this.user === this.issuer) {
				embed.setDescription('You don\'t have any reminders.');
			} else {
				embed.setDescription(this.user.getHandle() + ' doesn\'t have any reminders.');
			}
		}
		return embed;
	}
}

module.exports = UserReminderListHandler;
