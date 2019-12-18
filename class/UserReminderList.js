const common = require('../common');
const ReminderList = require('./ReminderList');

class UserReminderList extends ReminderList {
	user;
	issuer;

	constructor(channel, user, issuer) {
		super(channel, common.getRemindersOfUser(user));
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

module.exports = UserReminderList;
