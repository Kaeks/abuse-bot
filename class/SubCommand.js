const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');
const { argumentValues, permissionLevels } = enums;


class SubCommand extends Command {
	parent;

	/**
	 * Constructor
	 * @param {String} name
	 * @param {argumentValues} args
	 * @param {permissionLevels} permissionLevel
	 */
	constructor(name, args, permissionLevel = permissionLevels.NONE) {
		super(name, args, permissionLevel);
	}

	/**
	 * Sets the parent of this sub-command
	 * @param {Command} command
	 */
	setParent(command) {
		this.parent = command;
	}

	/**
	 * Gets the list of commands leading up to this (sub-)command
	 * @param list
	 * @returns {Array}
	 */
	getCommandChain(list = []) {
		list.unshift(this);
		if (this.hasOwnProperty('parent')) {
			return this.parent.getCommandChain(list);
		}
		return list;
	}

	/**
	 * Gets the root command of this (sub-)command
	 * @returns {Command}
	 */
	getRootCommand() {
		if (this.hasOwnProperty('parent')) {
			return this.parent.getRootCommand();
		}
		return this;
	}
}

module.exports = SubCommand;
