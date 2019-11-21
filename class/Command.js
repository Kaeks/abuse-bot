const common = require('../common');
const { Discord } = common;

const DocumentationEntry = require('./DocumentationEntry');

const argumentValues = require('../enum/ArgumentValueEnum');
const permissionLevels = require('../enum/PermissionLevelEnum');

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
		// Check if the permission level is lower than the parent's permission level and adjust in case
		if (this.permissionLevel > subCommand.permissionLevel) {
			common.info(
				'Permission level of command \'' + common.combineCommandChain(subCommand.getCommandChain()) +
				'\' had to be adjusted from ' + subCommand.permissionLevel + ' to ' + this.permissionLevel + '.'
			);
			subCommand.permissionLevel = this.permissionLevel;
		}
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
	 * Gets the list of commands leading up to this (sub-)command,
	 * but... well... it's just this one!
	 * @param list
	 * @returns {Array}
	 */
	getCommandChain(list = []) {
		list.unshift(this);
		return list;
	}

	/**
	 * Gets the root command of this (sub-)command,
	 * but... well... that is this one!
	 * @returns {Command}
	 */
	getRootCommand() {
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
