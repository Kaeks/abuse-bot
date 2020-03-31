const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const enums = require.main.require('./enum');
const { colors } = enums;

const MINUTE_MULTIPLIER = 60 * 1000;

class WaterTimer {
	user;
	interval;
	lastDate;
	nextDate;
	missed;

	/**
	 * Constructor
	 * @param {User} user
	 * @param {Number} interval
	 * @param {Date} lastDate
	 * @param {Date} nextDate
	 * @param {Number} missed
	 */
	constructor(user, interval, lastDate = undefined, nextDate = undefined, missed = 0) {
		this.user = user;
		this.interval = interval;
		let now = new Date();
		this.lastDate = lastDate || now;
		if (nextDate === undefined) {
			this.nextDate = new Date(now.valueOf() + this.interval * MINUTE_MULTIPLIER);
		} else {
			if (nextDate < now) {
				let nextInPastDiff = now - nextDate;
				let missedIntervals = Math.ceil(nextInPastDiff / (this.interval * MINUTE_MULTIPLIER));
				this.sendApology(missedIntervals);

				let diff = now - this.lastDate;
				let intervals = Math.ceil(diff / (this.interval * MINUTE_MULTIPLIER));

				this.nextDate = new Date(this.lastDate.valueOf() + intervals * this.interval * MINUTE_MULTIPLIER);
			} else {
				this.nextDate = nextDate;
			}
		}
		this.missed = missed;
	}

	/**
	 * Sends an apology for missing reminders
	 * @param missedIntervals
	 * @returns {Promise<boolean>}
	 */
	async sendApology(missedIntervals) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Sorry!')
			.setDescription(
				'I seem to have had some downtime. I couldn\'t remind you to stay hydrated ' +
				'**(' + missedIntervals + ')** time' + (missedIntervals !== 1 ? 's' : '') + '.'
			);
		await this.user.sendDm({ embed: embed});
		client.logger.log('Sent apology for ' + missedIntervals + ' missed reminders to ' + this.user);
		return true;
	}

	/**
	 * Sends the water reminder
	 * @returns {Promise<boolean>}
	 */
	async send() {
		let client = this.user.client;
		if (this.user.presence.status === 'offline' || (this.user.presence.status === 'dnd' && client.data.users[this.user.id].water.ignoreDnd !== true)) {
			this.missed++;
			client.logger.debug('User ' + this.user + ' missed water reminder. Now at ' + this.missed + '.');
			return false;
		}
		let embed = new Discord.RichEmbed()
			.setColor(colors.BLURPLE)
			.setTitle('Stay hydrated!')
			.setDescription('Drink some water **now**.')
			.setThumbnail('https://media.istockphoto.com/photos/splash-fresh-drop-in-water-close-up-picture-id801948192');
		if (this.missed > 0) {
			embed.setFooter('You missed (' + this.missed + ') reminder' + (this.missed !== 1 ? 's' : '') + '.');
		}
		await this.user.sendDm({ embed: embed});
		this.lastDate = new Date();
		this.missed = 0;
		client.logger.debug('Sent water reminder to ' + this.user + '.');
		return true;
	}

	trigger() {
		this.nextDate = new Date(new Date().valueOf() + this.interval * MINUTE_MULTIPLIER);
		this.send().catch(console.error);
	}

	/**
	 * Sets a new interval
	 * @param {number} newInterval
	 */
	updateInterval(newInterval) {
		let oldInterval = this.interval;
		this.interval = newInterval;
		let started = new Date(this.nextDate - oldInterval * MINUTE_MULTIPLIER);
		this.nextDate = new Date(started.valueOf() + newInterval * MINUTE_MULTIPLIER);
	}

	/**
	 * Gets the time left (in ms) until the water timer fires
	 * @returns {number}
	 */
	getStatus() { return this.nextDate - new Date(); }
}

module.exports = WaterTimer;
