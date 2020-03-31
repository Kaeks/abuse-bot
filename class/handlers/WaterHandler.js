const Discord = require.main.require('./discordjs_amends')
const util = require.main.require('./util');

const { WaterTimer } = require.main.require('./class');

const MINUTE_MULTIPLIER = 60 * 1000;

class WaterHandler {

    client;
    waterTimers;
    running;

    constructor(client) {
        this.client = client;
        this.waterTimers = new Discord.Collection();
        this.running = new Discord.Collection();
    }

    /**
     * Adds a water timer to the list of cached water timers
     * @param waterTimer
     */
    add(waterTimer) {
        this.waterTimers.set(waterTimer.user.id, waterTimer);
        this.saveAll();
    }

    trigger(waterTimer) {
        waterTimer.trigger();
    }

    /**
     * Starts the water timer
     * @param {WaterTimer} waterTimer
     */
    start(waterTimer) {
        if (this.running.has(waterTimer.user.id)) {
            throw 'Attempted to start already running water timer of user ' + waterTimer.user + '.';
        }
        let me = this;
        let now = new Date();
        let timer = setTimeout(function() {
            me.trigger(waterTimer);
            let subsequentInterval = setInterval(() => {
                me.trigger(waterTimer)
            }, waterTimer.interval * MINUTE_MULTIPLIER);
            me.running.set(waterTimer.user.id, subsequentInterval)
        }, waterTimer.nextDate - now);

        this.running.set(waterTimer.user.id, timer);

        this.client.logger.debug('Started water timer for ' + waterTimer.user + '.');
    }

    /**
     * Stops the water timer
     * @param {WaterTimer} waterTimer
     * @returns {boolean}
     */
    stop(waterTimer) {
        if (!this.running.has(waterTimer.user.id)) {
            this.client.logger.info('Water timer of user ' + waterTimer.user + ' was not running.');
            return false;
        }
        let timerEntry = this.running.get(waterTimer.user.id);
        clearInterval(timerEntry);
        this.running.delete(waterTimer.user.id);
        this.client.logger.debug('Stopped water timer of user ' + waterTimer.user + '.');
        return true;
    }

    /**
     * Sets a new interval
     */
    updateInterval(waterTimer, newInterval) {
        waterTimer.updateInterval(newInterval);
        this.saveAll();
        this.update(waterTimer);
        this.client.logger.debug('Updated interval of water timer of user ' + waterTimer.user + ' to ' + newInterval + '.');
    }

    /**
     * Updates the cached water timer
     */
    update(waterTimer) {
        this.stop(waterTimer);
        this.start(waterTimer);
    }

    /**
     * Loads all water timers to the list of cached water timers
     */
    loadAll() {
        for (let userId in this.client.data.users) {
            if (!this.client.data.users.hasOwnProperty(userId)) continue;
            let userEntry = this.client.data.users[userId];
            if (!userEntry.hasOwnProperty('water')) continue;
            if (userEntry.water.enabled === true) {
                let user = this.client.users.get(userId);
                let lastDate = userEntry.water.lastDate ? new Date(userEntry.water.lastDate) : undefined;
                let nextDate = userEntry.water.nextDate ? new Date(userEntry.water.nextDate) : undefined;
                let missed = userEntry.water.missed || 0;
                let waterTimer = new WaterTimer(user, userEntry.water.interval, lastDate, nextDate, missed);
                this.add(waterTimer);
            }
        }
        this.client.logger.debug('Loaded all water timers.');
    }

    /**
     * Saves all cached water timers into the database
     */
    saveAll() {
        this.waterTimers.forEach(waterTimer => {
            let user = waterTimer.user;
            let userWater = this.client.data.users[user.id].water;
            userWater.interval = waterTimer.interval;
            userWater.lastDate = waterTimer.lastDate;
            userWater.nextDate = waterTimer.nextDate;
            userWater.missed = waterTimer.missed;
        });
        this.client.dataHandler.save();
    }

    /**
     * Starts the water timers of all users
     */
    startAll() {
        this.waterTimers.forEach(waterTimer => {
            if (this.client.userIsWaterMember(waterTimer.user)) {
                this.start(waterTimer);
            }
        });
        this.client.logger.debug('Started all water timers.');
    }

}

module.exports = WaterHandler;
