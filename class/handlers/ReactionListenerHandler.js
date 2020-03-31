const Discord = require.main.require('./discordjs_amends');

const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class ReactionListenerHandler extends ClientBasedHandler {

    reactionListeners;

    constructor(client) {
        super(client);
        this.reactionListeners = new Discord.Collection();
    }

    /**
     * @name ReactionAction
     * @function
     * @param messageReaction
     * @param user
     * @param event
     */

    /**
     * Add a reaction listener to a message with a function that triggers when a reaction from the list of reactions is added or removed
     * @param msg
     * @param {ReactionAction} fn
     * @param reactions
     */
    add(msg, fn, reactions = []) {
        let id = Discord.SnowflakeUtil.generate();
        let temp = {
            id : id,
            msgId : msg.id,
            reactions : reactions,
            fn : fn
        };
        this.reactionListeners.set(id, temp);
        return id;
    }

    /**
     * Removes a reaction listener from the list of reaction listeners
     * @param id
     * @returns {boolean}
     */
    remove(id) {
        if (!this.reactionListeners.has(id)) return false;
        this.reactionListeners.delete(id);
        return true;
    }
}

module.exports = ReactionListenerHandler;
