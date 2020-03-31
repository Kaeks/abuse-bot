const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const { colors } = require.main.require('./enum');

class Reminder {

	id;
	users;
	userMsg;
	botMsg;
	date;
	task;

	constructor(userMsg, date, task, botMsg, id, users) {
		this.id = id || Discord.SnowflakeUtil.generate();
		this.users = users || [ userMsg.author ];
		this.userMsg = userMsg;
		this.botMsg = botMsg;
		this.date = date;
		this.task = task;
	}

	/**
	 * Sends the reminder to a user
	 * @param user
	 * @returns {Promise<void>}
	 */
	async send(user) {
		let otherUsersAmt = this.users.length - 1;
		let tempText = 'I\'m here to remind you about [this message](<' + this.userMsg.getLink() + '>).';
		if (this.task.length > 0) tempText += '\nThe task was:\n> ' + this.task;
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Reminder!')
			.setDescription(tempText);
		if (otherUsersAmt > 0) embed.setFooter(otherUsersAmt + ' other ' + (otherUsersAmt === 1 ? 'person' : 'people') + ' also got this reminder!');
		let channel = await user.getDmChannel();
		channel.send({ embed: embed });
	}

	/**
	 * Adds a user to the list of users of this reminder
	 * @param user
	 * @return {boolean} success
	 */
	addUser(user) {
		if (this.users.includes(user)) return false;
		this.users.push(user);
		return true;
	}

	/**
	 * Removes a user from the list of users of this reminder
	 * @param user
	 * @return {boolean} success
	 */
	removeUser(user) {
		if (!this.users.includes(user)) return false;
		this.users = this.users.filter(userEntry => {
			return userEntry !== user;
		});
		return true;
	}

	/**
	 * Toggles the status of a user on this reminder
	 * @param user
	 * @return {boolean} new state of the user on this reminder
	 */
	toggleUser(user) {
		if (this.users.includes(user)) {
			this.removeUser(user);
			return false;
		} else {
			this.addUser(user);
			return true;
		}
	}

	/**
	 * Gets the single line string of the reminder
	 * @param listPosition
	 * @returns {string}
	 */
	getSingleLine(listPosition) {
		let positionString = ' **#' + listPosition + '**';
		let linkString = '[' + util.parseDate(this.date) + '](<' + this.userMsg.getLink() + '>)';
		let taskString = this.task.length > 0 ? '\n> ' + this.task : '';
		return positionString + ' ' + linkString + taskString;
	}

	trigger() {
		this.users.forEach(user => {
			this.send(user).catch(console.error);
		});
	}

	format() {
		return {
			id : this.id,
			users : this.users.map(val => val.id),
			userMsg : this.userMsg.format(),
			botMsg : this.botMsg != null ? this.botMsg.format() : null,
			date : this.date,
			task : this.task
		};
	}
}

module.exports = Reminder;
