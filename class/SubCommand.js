const Command = require('./Command.js');
const argumentValues = require('../enum/ArgumentValueEnum.js');
const permissionLevels = require('../enum/PermissionLevelEnum.js');

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
		// Check if the permission level is lower than the parent's permission level and adjust in case
		if (this.parent.permissionLevel > this.permissionLevel) {
			this.permissionLevel = this.parent.permissionLevel;
		}
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

	getRootCommand(){
		if (this.hasOwnProperty('parent')) {
			return this.parent.getRootCommand();
		}
		return this;
	}
}

module.exports = SubCommand;
