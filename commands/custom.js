const Discord = require.main.require('./discordjs_amends');
const { inspect } = require('util');

const classes = require.main.require('./class');
const { Command, SubCommand, CustomFunction, handlers } = classes;
const { ConfirmationMessageHandler } = handlers;

const enums = require.main.require('./enum');
const { argumentValues, permissionLevels, colors } = enums;

let commandCustomAdd = new SubCommand('add', argumentValues.REQUIRED)
	.addDoc('<name> <function>', 'Add a custom function.')
	.setExecute((msg, suffix) => {
		let client = msg.client;
		let user = msg.author;
		let name = suffix.split(/ +/)[0];
		let temp = suffix.substring(name.length);
		let match = temp.match(/ +/);
		let fn = match !== null ? temp.substring(match[0].length) : null;
		if (client.customFunctionHandler.customFunctions.has(name)) {

			let confirmationHandler = new ConfirmationMessageHandler(client, msg.channel, () => {
				createCustomFunctionEntry(msg, name, fn, user);
			}, {
				users : [ user ],
				initialDesc : 'A custom command with the name `' + name + '` already exists.' + '\n' + 'Do you want to replace it?',
				initialTitle : 'Already exists!',
				acceptDesc : 'Replaced the custom function `' + name + '`.',
				acceptTitle : 'Replaced custom function!',
				altAcceptDesc : 'replaced the custom function `' + name + '`.'
			});
			confirmationHandler.build();
		} else {
			createCustomFunctionEntry(msg, name, fn, user);
		}
	});

let commandCustomList = new SubCommand('list', argumentValues.NONE)
	.addDoc('', 'List all custom functions.')
	.setExecute(msg => {
		let client = msg.client;
		let description = '';

		client.customFunctionHandler.customFunctions.forEach(customFunction => {
			description += `**${customFunction.name}** - ${customFunction.creator.getHandle()}\nCreated on ${customFunction.date}.`;
			if (customFunction !== client.customFunctionHandler.customFunctions.last()) {
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
		let client = msg.client;
		if (client.customFunctionHandler.customFunctions.size === 0) {
			let foundNoneEmbed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('No custom functions!')
				.setDescription('There are no custom functions to remove.');
			msg.channel.send({ embed: foundNoneEmbed });
		}
		let user = msg.author;

		let confirmationHandler = new ConfirmationMessageHandler(client, msg.channel, () => {
			if (!client.customFunctionHandler.deleteAll()) {
				let errorEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Oops!')
					.setDescription('Something went wrong when trying to remove all custom functions.');
				msg.channel.send({embed : errorEmbed});
				return false;
			}
		}, {
			users : [ user ],
			initialDesc : 'You are about to remove **ALL** custom functions. Do you want to proceed?',
			initialTitle : 'Are you sure?',
			acceptDesc : 'Successfully removed all custom functions.',
			acceptTitle : 'Removed all custom functions!',
			altAcceptDesc : 'removed all custom functions.'
		});
		confirmationHandler.build();
	});

let commandCustomRemove = new SubCommand('remove', argumentValues.REQUIRED)
	.addDoc('<name>', 'Remove a custom function.')
	.addSub(commandCustomRemoveAll)
	.setExecute((msg, suffix) => {
		let client = msg.client;
		if (!client.customFunctionHandler.customFunctions.has(suffix)) {
			let notFoundEmbed = new Discord.RichEmbed()
				.setColor(colors.RED)
				.setTitle('Not found!')
				.setDescription('I couldn\'t find a custom function called `' + suffix + '`.');
			msg.channel.send({ embed: notFoundEmbed });
			return false;
		}

		let user = msg.author;
		let customFunction = client.customFunctionHandler.customFunctions.get(suffix);

		let confirmationHandler = new ConfirmationMessageHandler(client, msg.channel, () => {
			if (!client.customFunctionHandler.delete(customFunction)) {
				let errorEmbed = new Discord.RichEmbed()
					.setColor(colors.RED)
					.setTitle('Oops!')
					.setDescription('Something went wrong when trying to remove that custom function.');
				msg.channel.send({embed : errorEmbed});
				return false;
			}
		}, {
			users : [ user ],
			initialDesc : 'You are about to remove the custom function ' + suffix + '. Do you want to proceed?',
			initialTitle : 'Are you sure?',
			acceptDesc : 'Removed the custom function ' + suffix + '.',
			acceptTitle : 'Removed custom function!',
			altAcceptDesc : 'removed the custom function ' + suffix + '.'
		});
		confirmationHandler.build();
	});

let commandCustomExecute = new SubCommand('execute', argumentValues.REQUIRED)
	.addDoc('<name>', 'Execute a custom function.')
	.setExecute(async (msg, suffix) => {
		let client = msg.client;
		if (client.customFunctionHandler.customFunctions.has(suffix)) {
			try {
				let result = await client.customFunctionHandler.customFunctions.get(suffix).execute(msg);
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
	msg.client.customFunctionHandler.add(customFunction);
	let createdEmbed = new Discord.RichEmbed()
		.setColor(colors.PRESTIGE)
		.setTitle('Created custom function!')
		.setDescription('Created the custom function `' + name + '`.' + '\n' + '>>> ' + fn);
	msg.channel.send({ embed: createdEmbed });
}
