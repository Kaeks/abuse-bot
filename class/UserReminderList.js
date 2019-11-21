const common = require('../common');
const ReminderList = require('./ReminderList');

class UserReminderList extends ReminderList {
	user;

	constructor(msg, user) {
		super(msg, common.getRemindersOfUser(user));
		this.user = user;
	}
}

module.exports = UserReminderList;
