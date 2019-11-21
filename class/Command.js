const common = require('../common.js');
const { Discord } = common;

const DocumentationEntry = require('./DocumentationEntry.js');

const argumentValues = require('../enum/ArgumentValueEnum.js');
const permissionLevels = require('../enum/PermissionLevelEnum.js');

class Command {
	name;
	args;
	permissionLevel;
	sub = new Discord.Collection();
	doc = [];

	/**
	 * Constructor
	 * @param {String} name
	 * @param {argumentValues} args
	 * @param {permissionLevels} permissionLevel
	 * @return {Command}
	 */
	constructor(name, args, permissionLevel = permissionLevels.NONE) {
		this.name = name;
		if (Object.values(argumentValues).includes(args)) {
			this.args = args;
		} else {
			throw 'Argument value ' + args + ' does not exist.';
		}
		if (Object.values(permissionLevels).includes(permissionLevel)) {
			this.permissionLevel = permissionLevel
		} else {
			throw 'Permission level ' + permissionLevel + ' does not exist.';
		}
	}

	/**
	 * Adds a sub-command to the list of sub-commands
	 * @param subCommand
	 * @returns {Command}
	 */
	addSub(subCommand) {
		subCommand.setParent(this);
		this.sub.set(subCommand.name, subCommand);
		return this;
	}

	/**
	 * Adds a documentation entry (usage + desc pair) to this command
	 * @param {String} usage
	 * @param {String} description
	 * @return {Command}
	 */
	addDoc(usage = '', description = '') {
		this.doc.push(new DocumentationEntry(usage, description));
		return this;
	}

	/**
	 * Sets the execute function of the command
	 * @param {Function} fn
	 * @return {Command}
	 */
	setExecute(fn) {
		this.execute = fn;
		return this;
	}

	/**
	 * Execute function of the command
	 * @param {Message} msg
	 * @param {String} suffix
	 */
	execute(msg, suffix = null) {}
}

module.exports = Command;
