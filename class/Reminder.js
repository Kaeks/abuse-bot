const common = require('../common.js');
const { Discord, client } = common;
let { reminders } = common;

const reactionEvents = require('../enum/ReactionEventEnum.js');

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

		common.addReminder(this);
	}

	/**
	 * Recursive running function to handle times larger than the 32-bit signed positive integer limit in milliseconds
	 * @param {Date} started
	 */
	runTimer(started = new Date()) {
		let me = this;
		let now = new Date();
		let future = new Date(this.date);
		let diff = future - now;
		if (diff < 0) {
			common.info('Reminder with id ' + this.id + ' has its starting point in the past. Deleting.');
			this.delete();
			return false;
		}
		let timer;
		if (diff > 0x7FFFFFFF) {
			timer = setTimeout(function() {
				me.runTimer(started);
			});
		} else {
			timer = setTimeout(function() {
				me.trigger().catch(console.error);
			}, diff);
		}
		common.runningReminders.set(this.id, timer);
		return true;
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
	 * Triggers the reminder
	 * @returns {Promise<void>}
	 */
	async trigger() {
		for (let userEntry of this.users) {
			let user = client.users.get(userEntry);
			await this.send(user);
		}
		common.debug('Triggered reminder with id ' + this.id + '.');
		this.delete();
		common.saveReminders();
	}

	/**
	 * Stops the reminder timer
	 */
	stop() {
		if (!common.runningReminders.has(this.id)) {
			common.info('Timer of reminder with id ' + this.id + ' was not running.');
			return false;
		}
		let timerEntry = common.runningReminders.get(this.id);
		clearInterval(timerEntry);
		common.runningReminders.delete(this.id);
		common.debug('Stopped timer of reminder with id ' + this.id + '.');
		return true;
	}

	/**
	 * Deletes the reminder
	 */
	delete() {
		this.stop();
		reminders.delete(this.id);
		common.saveReminders();
		common.debug('Deleted reminder with id ' + this.id + '.');
	}

	async getFixedMessage(msgId) {
		let foundChannel = await common.findChannelOfMsgId(msgId);
		return {
			id : msgId,
			channel : {
				id : foundChannel.id,
				type : foundChannel.type
			}
		}
	}

	async fix() {
		if (this.userMsg.hasOwnProperty('channel')) {
			this.userMsg = await this.getFixedMessage(this.userMsg);
		}
		if (!this.botMsg.hasOwnProperty('channel')) {
			this.botMsg = await this.getFixedMessage(this.botMsg);
		}
		reminders.set(this.id, this);
		common.saveReminders();
	}

	/**
	 * Starts the reminder timer
	 * @returns {boolean}
	 */
	async start() {
		if (!this.runTimer()) {
			common.info('Reminder with id ' + this.id + ' could not be started.');
			return false;
		}
		common.debug('Started reminder with id ' + this.id + '.');

		if (this.botMsg == null) {
			common.info('Reminder with id ' + this.id + ' doesn\'t have a bot message.');
			return true;
		}

		if (typeof this.botMsg === 'string') {
			// migration
			await this.fix
		}

		let channel = client.channels.get(this.botMsg.channel.id);
		let botMsg;
		try {
			botMsg = await channel.fetchMessage(this.botMsg.id);
		} catch (e) {
			common.info('Could not fetch bot message of reminder with id ' + this.id + '.');
			this.botMsg = null;
			reminders.set(this.id, this);
			common.saveReminders();
			return true;
		}
		common.addReactionListener(botMsg, (messageReaction, reactor, event) => {
			if (event === reactionEvents.ADD) {
				this.addUser(reactor);
			} else if (event === reactionEvents.REMOVE) {
				this.removeUser(reactor);
			}
		}, [ common.REMINDER_SIGNUP_EMOJI ]);
		common.debug('Added listener to bot message of reminder with id ' + this.id + '.');
		return true;
	}

	/**
	 * Adds a user to the list of users of this reminder
	 * @param user
	 * @return {boolean} success
	 */
	addUser(user) {
		if (this.users.includes(user)) return false;
		this.users.push(user);
		common.saveReminders();
		common.log(user + ' joined reminder ' + this.id + '.');
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
		common.saveReminders();
		common.log(user + ' left reminder ' + this.id + '.');
		return true;
	}

	getSingleLine(listPosition) {
		let positionString = ' **#' + listPosition + '**';
		let linkString = '[' + common.parseDate(this.date) + '](<' + this.userMsg.getLink() + '>)';
		let taskString = this.task.length > 0 ? '\n> ' + this.task : '';
		return positionString + ' ' + linkString + taskString;
	}
}

module.exports = Reminder;
