const common = require('../common');
const { Discord } = common;
const enums = require('../enum');

const MessageHandler = require('./MessageHandler');

const { colors, timeSpans, confirmationEmojis } = enums;

class ConfirmationMessageHandler extends MessageHandler {

	options;
	confirmFunction;

	initialEmbed;
	timeoutEmbed;

	/**
	 * @param {Discord.Channel} channel
	 * @param confirmFunction
	 * @param options
	 */
	constructor(channel, confirmFunction, options) {
		super(channel);
		this.confirmFunction = confirmFunction ? confirmFunction : () => {};

		options.users = options.users || [];
		options.confirmationEmojis = options.confirmationEmojis || Object.values(confirmationEmojis);
		options.prefEmoji = options.prefEmoji || '👌';
		options.initialDesc = options.initialDesc || 'You\'re about to do a thing.';
		options.initialTitle = options.initialTitle || 'Do thing?';
		options.acceptDesc = options.acceptDesc || 'Did the thing!';
		options.acceptTitle = options.acceptTitle || 'Done!';
		options.altAcceptDesc = options.altAcceptDesc || 'did the thing.';
		options.timeout = options.timeout || 15;

		this.options = options;

		this.initialEmbed = new Discord.RichEmbed()
			.setColor(colors.PURPLE)
			.setTitle(options.initialTitle)
			.setDescription(options.initialDesc)
			.setFooter('React with ' + this.options.prefEmoji + ' to confirm (' + options.timeout + ' seconds)');
		this.timeoutEmbed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Confirmation timed out!')
			.setDescription('You did not confirm your action. Process aborted.');
	}

	triggerTimedOut() {
		this.message.edit({ embed: this.timeoutEmbed }).then(message => {
			message.delete(5000);
		})
	}

	handleReactions(collected) {
		let reactionEmojiName = collected.first().emoji.name;
		let reactionEmojiBase = reactionEmojiName.substring(0,2);
		let friendlyDescription = this.options.prefEmoji + ' ' + this.options.acceptDesc;
		let rudeDescription = 'Listen up, kid. You were supposed to react with ' + this.options.prefEmoji + ' and not '
			+ reactionEmojiName + '. I\'ll let that slip this time and' + ' ' + this.options.altAcceptDesc;
		let successEmbed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle(this.options.acceptTitle)
			.setDescription(reactionEmojiBase === this.options.prefEmoji ? friendlyDescription : rudeDescription);
		this.message.edit({ embed: successEmbed });
	}

	async build() {
		super.build();
		this.channel.send({ embed: this.initialEmbed }).then(message => {
			this.message = message;
			message.react(this.options.prefEmoji);
			message.awaitReactions((reaction, reactor) => {
				return this.options.confirmationEmojis.includes(reaction.emoji.name) && (this.options.users.length === 0 || this.options.users.includes(reactor));
			}, {
				time : this.options.timeout * timeSpans.SECOND,
				max : 1,
				errors : ['time']
			}).then(collected => {
				if (this.confirmFunction(collected) === false) return false;
				this.handleReactions(collected);
			}).catch(() => {
				this.triggerTimedOut();
			});
		});
	}
}

module.exports = ConfirmationMessageHandler;
