const common = require('../common.js');
const ReminderList = require('./ReminderList.js');

class UserReminderList extends ReminderList {
	user;

	constructor(msg, user) {
		super(msg, common.getRemindersOfUser(user));
		this.user = user;
	}
}

module.exports = UserReminderList;
