const { reactionEvents } = require.main.require('./enum');

module.exports = (client, messageReaction, user) => {
	client.handleReaction(messageReaction, user, reactionEvents.REMOVE);
}
