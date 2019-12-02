const { inspect } = require('util');

const common = require('../common');
const { Discord, Config } = common;

const Command = require('../class/Command');
const SubCommand = require('../class/SubCommand');
const CustomFunction = require('../class/CustomFunction');

// IMPORT ALL ENUMS
const enums = require('../enum');
const { argumentValues, permissionLevels, colors } = enums;

let commandCustomAdd = new SubCommand('add', argumentValues.REQUIRED)
	.addDoc('<name> <function>', 'Add a custom function.')
	.setExecute((msg, suffix) => {
		let user = msg.author;
		let name = suffix.split(/ +/)[0];
		let temp = suffix.substring(name.length);
		let match = temp.match(/ +/);
		let fn = match !== null ? temp.substring(match[0].length) : null;
		if (common.customFunctions.has(name)) {
			const CONFIRMATION_TIMEOUT = 30;
			let existsEmbed = new Discord.RichEmbed()
				.setColor(colors.PURPLE)
				.setTitle('Already exists!')
				.setDescription(
					'A custom command with the name `' + name + '` already exists.' + '\n'
					+ 'Do you want to replace it?'
				).setFooter('React with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' to confirm (' + CONFIRMATION_TIMEOUT + ' seconds)');
			msg.channel.send({ embed: existsEmbed }).then(message => {
				message.react(common.PREF_CONFIRMATION_EMOJI_BASE);
				message.awaitReactions((reaction, reactor) => {
					return Object.values(enums.confirmationEmojis).includes(reaction.emoji.name) && reactor === user
				}, {
					time : CONFIRMATION_TIMEOUT * enums.timeSpans.SECOND,
					max : 1,
					errors : ['time']
				}).then(collected => {
					createCustomFunctionEntry(msg, name, fn, user);
					let reactionEmojiName = collected.first().emoji.name;
					let reactionEmojiBase = reactionEmojiName.substring(0,2);
					let friendlyDescription = common.PREF_CONFIRMATION_EMOJI_BASE + ' Replaced the custom function `' + name + '`.';
					let rudeDescription = 'Listen up, kid. You were supposed to react with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' and not '
						+ reactionEmojiName + '.' + '\n'
						+ 'I\'ll let that slip this time and replaced the custom function `' + name + '`.';
					let successEmbed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Replaced custom function!')
						.setDescription(reactionEmojiBase === common.PREF_CONFIRMATION_EMOJI_BASE ? friendlyDescription : rudeDescription);
					message.edit({ embed: successEmbed });
				}).catch(() => {
					let abortedEmbed = new Discord.RichEmbed()
						.setColor(colors.RED)
						.setTitle('Confirmation timed out!')
						.setDescription('You did not confirm your action. Process aborted.');
					message.edit({ embed: abortedEmbed }).then(editedMessage => {
						editedMessage.delete(5000);
					});
				});
			});
		} else {
			createCustomFunctionEntry(msg, name, fn, user);
		}
	});

let commandCustomList = new SubCommand('list', argumentValues.NONE)
	.addDoc('', 'List all custom functions.')
	.setExecute(msg => {
		let description = '';

		common.customFunctions.forEach(customFunction => {
			description += `**${customFunction.name}** - ${customFunction.creator.getHandle()}\nCreated on ${customFunction.date}.`;
			if (customFunction !== common.customFunctions.last()) {
				description += '\n';
			}
		});

		let embed = new Discord.RichEmbed()
			.setColor(colors.PRESTIGE)
			.setTitle('Custom functions!')
			.setDescription(description);
		msg.channel.send({ embed: embed });
	});

let commandCustomRemoveAll = new SubCommand('all', argumentValues.NONE)
	.addDoc('', 'Remove all custom functions.')
	.setExecute(msg => {
		if (common.customFunctions.size === 0) {
			let foundNoneEmbed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('No custom functions!')
				.setDescription('There are no custom functions to remove.');
			msg.channel.send({ embed: foundNoneEmbed });
		}
		let user = msg.author;
		// Timeout for confirmation reaction in seconds
		const CONFIRMATION_TIMEOUT = 30;

		let confirmationEmbed = new Discord.RichEmbed()
			.setColor(colors.PURPLE)
			.setTitle('Are you sure?')
			.setDescription('You are about to remove **ALL** custom functions. Is that ' + common.PREF_CONFIRMATION_EMOJI_BASE + '?')
			.setFooter('React with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' to confirm (' + CONFIRMATION_TIMEOUT + ' seconds)');
		msg.channel.send({ embed: confirmationEmbed }).then(message => {
			message.react(common.PREF_CONFIRMATION_EMOJI_BASE);
			message.awaitReactions((reaction, reactor) => {
				return Object.values(enums.confirmationEmojis).includes(reaction.emoji.name) && reactor === user
			}, {
				time : CONFIRMATION_TIMEOUT * enums.timeSpans.SECOND,
				max : 1,
				errors : ['time']
			}).then(collected => {
				if (!common.deleteAllCustomFunctions()) {
					let errorEmbed = new Discord.RichEmbed()
						.setColor(colors.RED)
						.setTitle('Oops!')
						.setDescription('Something went wrong when trying to remove all custom functions.');
					msg.channel.send({embed : errorEmbed});
					return false;
				}
				let reactionEmojiName = collected.first().emoji.name;
				let reactionEmojiBase = reactionEmojiName.substring(0,2);
				let friendlyDescription = common.PREF_CONFIRMATION_EMOJI_BASE + ' Successfully removed all custom functions.';
				let rudeDescription = 'Listen up, kid. You were supposed to react with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' and not '
					+ reactionEmojiName + '.' + '\n'
					+ 'I\'ll let that slip this time and removed all custom functions.';
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Removed all custom functions!')
					.setDescription(reactionEmojiBase === common.PREF_CONFIRMATION_EMOJI_BASE ? friendlyDescription : rudeDescription);
				message.edit({ embed: successEmbed });
			}).catch(() => {
				let abortedEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Confirmation timed out!')
					.setDescription('You did not confirm your action. Process aborted.');
				message.edit({ embed: abortedEmbed }).then(editedMessage => {
					editedMessage.delete(5000);
				});
			});
		});
	});

let commandCustomRemove = new SubCommand('remove', argumentValues.REQUIRED)
	.addDoc('<name>', 'Remove a custom function.')
	.addSub(commandCustomRemoveAll)
	.setExecute((msg, suffix) => {
		if (!common.customFunctions.has(suffix)) {
			let notFoundEmbed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('Not found!')
				.setDescription('I couldn\'t find a custom function called `' + suffix + '`.');
			msg.channel.send({ embed: notFoundEmbed });
			return false;
		}
		let user = msg.author;
		// Timeout for confirmation reaction in seconds
		const CONFIRMATION_TIMEOUT = 30;

		let confirmationEmbed = new Discord.RichEmbed()
			.setColor(colors.PURPLE)
			.setTitle('Are you sure?')
			.setDescription('You are about to remove the custom function ' + suffix + '. Is that ' + common.PREF_CONFIRMATION_EMOJI_BASE + '?')
			.setFooter('React with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' to confirm (' + CONFIRMATION_TIMEOUT + ' seconds)');
		msg.channel.send({ embed: confirmationEmbed }).then(message => {
			message.react(common.PREF_CONFIRMATION_EMOJI_BASE);
			message.awaitReactions((reaction, reactor) => {
				return Object.values(enums.confirmationEmojis).includes(reaction.emoji.name) && reactor === user
			}, {
				time : CONFIRMATION_TIMEOUT * enums.timeSpans.SECOND,
				max : 1,
				errors : ['time']
			}).then(collected => {
				let customFunction = common.customFunctions.get(suffix);
				if (!customFunction.delete()) {
					let errorEmbed = new Discord.RichEmbed()
						.setColor(colors.RED)
						.setTitle('Oops!')
						.setDescription('Something went wrong when trying to remove that custom function.');
					msg.channel.send({embed : errorEmbed});
					return false;
				}
				let reactionEmojiName = collected.first().emoji.name;
				let reactionEmojiBase = reactionEmojiName.substring(0,2);
				let friendlyDescription = common.PREF_CONFIRMATION_EMOJI_BASE + ' Removed the custom function ' + suffix + '.';
				let rudeDescription = 'Listen up, kid. You were supposed to react with ' + common.PREF_CONFIRMATION_EMOJI_BASE + ' and not '
					+ reactionEmojiName + '.' + '\n'
					+ 'I\'ll let that slip this time and removed the custom function ' + suffix + '.';
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Removed custom function!')
					.setDescription(reactionEmojiBase === common.PREF_CONFIRMATION_EMOJI_BASE ? friendlyDescription : rudeDescription);
				message.edit({ embed: successEmbed });
			}).catch(() => {
				let abortedEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Confirmation timed out!')
					.setDescription('You did not confirm your action. Process aborted.');
				message.edit({ embed: abortedEmbed }).then(editedMessage => {
					editedMessage.delete(5000);
				});
			});
		});
	});

let commandCustomExecute = new SubCommand('execute', argumentValues.REQUIRED)
	.addDoc('name', 'Execute a custom function.')
	.setExecute(async (msg, suffix) => {
		if (common.customFunctions.has(suffix)) {
			try {
				let result = await common.customFunctions.get(suffix).execute(msg);
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.PRESTIGE)
					.setTitle('Custom function result!')
					.setDescription(inspect(result));
				msg.channel.send({ embed: successEmbed });
			} catch (e) {
				let errorEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Custom function error!')
					.setDescription(e);
				msg.channel.send({ embed: errorEmbed });
			}
		} else {
			let notFoundEmbed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('Not found!')
				.setDescription('I couldn\'t find a custom function called `' + suffix + '`.');
			msg.channel.send({ embed: notFoundEmbed });
		}
	});

let commandCustom = new Command('custom', argumentValues.NULL, permissionLevels.BOT_OWNER)
	.addSub(commandCustomAdd)
	.addSub(commandCustomRemove)
	.addSub(commandCustomList)
	.addSub(commandCustomExecute);

module.exports = commandCustom;

function createCustomFunctionEntry(msg, name, fn, creator) {
	let customFunction = new CustomFunction(name, fn, creator);
	common.addCustomFunction(customFunction);
	let createdEmbed = new Discord.RichEmbed()
		.setColor(colors.PRESTIGE)
		.setTitle('Created custom function!')
		.setDescription('Created the custom function `' + name + '`.' + '\n' + '>>> ' + fn);
	msg.channel.send({ embed: createdEmbed });
}
