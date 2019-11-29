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
		let name = suffix.split(/ +/)[0];
		let temp = suffix.substring(name.length);
		let match = temp.match(/ +/);
		let fn = match !== null ? temp.substring(match[0].length) : null;
		let customFunction = new CustomFunction(name, fn, msg.author);
		common.addCustomFunction(customFunction);
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
	.setExecute((msg, suffix) => {
	});

let commandCustomRemove = new SubCommand('remove', argumentValues.REQUIRED)
	.addDoc('<#>', 'Remove a custom function.')
	.addSub(commandCustomRemoveAll)
	.setExecute((msg, suffix) => {
	});

let commandCustomExecute = new SubCommand('execute', argumentValues.REQUIRED)
	.addDoc('name', 'Execute a custom function.')
	.setExecute((msg, suffix) => {
		if (common.customFunctions.has(suffix)) {
			try {
				let result = common.customFunctions.get(suffix).execute(msg);
				let successEmbed = new Discord.RichEmbed()
					.setColor(colors.PRESTIGE)
					.setTitle('Custom function result!')
					.setDescription(result);
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
