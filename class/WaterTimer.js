const common = require('../common');
const { Discord, Storage } = common;

const colors = require('../enum/EmbedColorEnum');

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
		common.log('Sent apology for ' + missedIntervals + ' missed reminders to ' + this.user);
		return true;
	}

	/**
	 * Sends the water reminder
	 * @returns {Promise<boolean>}
	 */
	async send() {
		if (this.user.presence.status === 'offline' || (this.user.presence.status === 'dnd' && Storage.users[this.user.id].water.ignoreDnd !== true)) {
			this.missed++;
			common.debug('User ' + this.user + ' missed water reminder. Now at ' + this.missed + '.');
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
		common.debug('Sent water reminder to ' + this.user + '.');
		return true;
	}

	trigger() {
		this.nextDate = new Date(new Date().valueOf() + this.interval * MINUTE_MULTIPLIER);
		this.send().catch(console.error);
		common.saveWaterTimers();
	}

	/**
	 * Starts the water timer
	 */
	start() {
		if (common.runningWaterTimers.has(this.user.id)) {
			throw 'Attempted to start already running water timer of user ' + this.user + '.';
		}
		let me = this;
		let now = new Date();
		let timer = setTimeout(function() {
			me.trigger();
			let subsequentInterval = setInterval(me.trigger, me.interval * MINUTE_MULTIPLIER);
			common.runningWaterTimers.set(me.user.id, subsequentInterval)
		}, this.nextDate - now);

		common.runningWaterTimers.set(this.user.id, timer);

		common.debug('Started water timer for ' + this.user + '.');
	}

	/**
	 * Stops the water timer
	 * @returns {boolean}
	 */
	stop() {
		if (!common.runningWaterTimers.has(this.user.id)) {
			common.info('Water timer of user ' + this.user + ' was not running.');
			return false;
		}
		let timerEntry = common.runningWaterTimers.get(this.user.id);
		clearInterval(timerEntry);
		common.runningWaterTimers.delete(this.user.id);
		common.debug('Stopped water timer of user ' + this.user + '.');
		return true;
	}

	/**
	 * Sets a new interval
	 */
	updateInterval(newInterval) {
		let oldInterval = this.interval;
		this.interval = newInterval;
		let started = new Date(this.nextDate - oldInterval * MINUTE_MULTIPLIER);
		this.nextDate = new Date(started.valueOf() + newInterval * MINUTE_MULTIPLIER);
		common.saveWaterTimers();
		this.update();
		common.debug('Updated interval of water timer of user ' + this.user + ' to ' + newInterval + '.');
	}

	/**
	 * Updates the cached water timer
	 */
	update() {
		this.stop();
		this.start();
	}

	/**
	 * Gets the time left (in ms) until the water timer fires
	 * @returns {number}
	 */
	getStatus() { return this.nextDate - new Date(); }
}

module.exports = WaterTimer;
