const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class WednesdayHandler extends ClientBasedHandler {

    constructor(client) {
        super(client);
    }

    start() {
        let now = new Date();
        let nextWednesday = this.getNextWednesday(now);

        this.runTimer(nextWednesday);
    }

    /**
     * Recursive running function to handle times larger than the 32-bit signed positive integer limit in milliseconds
     * @param {Date} end
     * @param {Date} started
     */
    runTimer(end, started = new Date()) {
        let me = this;
        let now = new Date();
        let future = new Date(end);
        let diff = future - now;
        if (diff < 0) {
            return false;
        }
        if (diff > 0x7FFFFFFF) {
            setTimeout(function() {
                me.runTimer(end, started);
            });
        } else {
            setTimeout(function() {
                me.trigger().catch(console.error);
            }, diff);
        }
        return true;
    }

    getNextWednesday(date) {
        let result = new Date(date.getTime());
        result.setDate(date.getDate() + (7 + 3 - date.getDay()) % 7);
        result.setHours(0, 0, 3, 0);
        return result;
    }

    async trigger() {
        for (let serverEntry in this.client.data.servers) {
            if (!this.client.data.servers.hasOwnProperty(serverEntry)) continue;
            let cur = this.client.data.servers[serverEntry];
            if (!cur.channels.hasOwnProperty('wednesday')) continue;
            if (cur.disabledFeatures.wednesday !== true) {
                let channelEntry = cur.channels.wednesday;
                let channel = this.client.channels.get(channelEntry);
                util.sendWednesday(channel);
            }
        }
        for (let userEntry in this.client.data.users) {
            if (!this.client.data.users.hasOwnProperty(userEntry)) continue;
            let cur = this.client.data.users[userEntry];
            if (cur.hasOwnProperty('wednesday')) continue;
            if (cur.wednesday === true) {
                let user = this.client.users.get(userEntry);
                let channel = await user.getDmChannel();
                util.sendWednesday(channel);
            }
        }
        this.start();
    }
}

module.exports = WednesdayHandler;
