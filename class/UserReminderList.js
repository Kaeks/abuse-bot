const common = require('../common');
const ReminderList = require('./ReminderList');

class UserReminderList extends ReminderList {
	user;

	constructor(msg, user) {
		super(msg, common.getRemindersOfUser(user));
		this.user = user;
	}

	getFooterText(channel) {
		let footerText = '';
		if (channel.type !== 'dm' || this.userMsg.author !== this.user) {
			let userHandle = this.user.getHandle();
			footerText += 'If the reminder was issued in a DM the link won\'t work for others except for ' + userHandle + '.\n'
		}
		footerText += super.getFooterText(channel);
		return footerText;
	}

	getEmbed(channel) {
		let embed = super.getEmbed(channel);
		embed.setAuthor(this.user.username, this.user.avatarURL);

		// Return special message for empty collection
		if (this.reminders.size === 0) {
			if (this.user === this.userMsg.author) {
				embed.setDescription('You don\'t have any reminders.');
			} else {
				embed.setDescription(this.user.getHandle() + ' doesn\'t have any reminders.');
			}
		}
		return embed;
	}
}

module.exports = UserReminderList;
