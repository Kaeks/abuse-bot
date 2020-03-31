const Discord = require('discord.js');

/**
 * Returns the DM Channel of a user. Creates one if it does not exist.
 * @returns {Promise<DMChannel|undefined>}
 */
Discord.User.prototype.getDmChannel = async function() {
    if (this.bot) return undefined;
    return this.dmChannel != null ? this.dmChannel : await this.createDM();
};

/**
 * Sends a DM to a user without having to check for a DM channel first.
 * @param data
 * @returns {Promise<*>}
 */
Discord.User.prototype.sendDm = async function(data) {
    let channel = await this.getDmChannel();
    return channel.send(data);
};

/**
 * Returns the full handle (name, #, discriminator) of the user
 * @returns {string}
 */
Discord.User.prototype.getHandle = function() {
    return this.username + '#' + this.discriminator;
};

/**
 * Returns the direct link to a message
 * @returns {String}
 */
Discord.Message.prototype.getLink = function () {
    return 'http://discordapp.com/channels/' + ((this.channel.type === 'text') ? this.guild.id : '@me') + '/' + this.channel.id + '/' + this.id;
};

/**
 * Formats a message for storage
 * @returns {{channel: {id: *, type: *}, id: Discord.Message.id}}
 */
Discord.Message.prototype.format = function () {
    let msgEntry = {
        id: this.id,
        channel: {
            id: this.channel.id,
            type: this.channel.type
        }
    };
    if (this.channel.type === 'dm') {
        msgEntry.channel.recipient = {
            id: this.channel.recipient.id
        }
    }
    return msgEntry;
};

/**
 * Returns a simplified version of a collection that starts at 0 and iterates by adding 1 to each entry
 * @returns {Discord.Collection<int, *>}
 */
Discord.Collection.prototype.simplify = function () {
    let simple = new Discord.Collection();
    let counter = 0;
    this.forEach(value => {
        simple.set(counter, value);
        counter++;
    });
    return simple;
};

/**
 * Returns a page of this collection limited by an amount
 * @param {Number} limit
 * @param {Number} page
 * @returns {Discord.Collection<*, *>}
 */
Discord.Collection.prototype.getSubList = function (limit, page = 0) {

    if (this.size < page * limit + 1) {
        throw 'Collection size (' + this.size + ') with limit (' + limit + ') is too small for the given page count (' + page + ').';
    }

    let subList = new Discord.Collection();
    for (let i = page * limit; i < limit * (page + 1); i++) {
        let cur = this.array()[i];
        if (cur === undefined) break;
        subList.set(i, cur);
    }
    return subList;
};

module.exports = Discord;
