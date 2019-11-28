const common = require('../common');
const { Discord, Config } = common;

const Command = require('../class/Command');
const SubCommand = require('../class/SubCommand');

// IMPORT ALL ENUMS
const enums = require('../enum');

let commandCustomAdd = new SubCommand('add', argumentValues.REQUIRED)
	.addDoc('<name> <function>', 'Add a custom function.')
	.setExecute((msg, suffix) => {
	});

let commandCustomList = new SubCommand('list', argumentValues.NONE)
	.addDoc('', 'List all custom functions.')
	.setExecute((msg, suffix) => {
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
	});

let commandCustom = new Command('custom', argumentValues.NULL, permissionLevels.BOT_OWNER)
	.addSub(commandCustomAdd)
	.addSub(commandCustomRemove)
	.addSub(commandCustomList)
	.addSub(commandCustomExecute);

module.exports = commandCustom;
