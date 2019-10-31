const { debug } = require('./data.json');
const { prefix } = require('./config.json');

module.exports = {

	argumentValues : {
		NONE : 0,
		OPTIONAL : 1,
		REQUIRED : 2
	},

	info(msg) {
		console.log('\x1b[33m%s\x1b[0m', `[INFO] ${msg}`);
	},

	warn(msg) {
		console.log('\x1b[31m%s\x1b[0m', `[WARN] ${msg}`);
	},

	debug(msg) {
		if (debug) console.log('\x1b[36m%s\x1b[0m', `[DEBUG] ${msg}`);
	},

	unparseDate(date) {
		let dateString;
		if (Date.compare(Date.parse(date), (1).day().fromNow()) === 1) {
			if (Date.compare(Date.parse(date), (1).year().fromNow()) === 1) {
				dateString = Date.parse(date).toString('MMM dS, yyyy HH:mm');
			} else {
				dateString = Date.parse(date).toString('MMM dS HH:mm');
			}
		} else {
			dateString = Date.parse(date).toString('HH:mm');
		}
		return dateString;
	},

	combineCommandChain(commandChain) {
		let commandString = '';
		for (let i = 0; i < commandChain.length; i++) {
			commandString += commandChain[i].name;
			if (i < commandChain.length - 1) commandString += ' ';
		}
		return commandString;
	},

	getHelpRow(commandString, usage, description) {
		let base = '`' + prefix + commandString + ' ' + usage + '`' + '\n';
		return description === undefined ? base : base + '-- ' + description + '\n';
	},

	getCommandHelp(command, commandChain = []) {
		let localCommandChain = commandChain.slice();
		localCommandChain.push(command);

		let helpText = '';

		let commandString = combineCommandChain(localCommandChain);

		if (command.hasOwnProperty('usage')) {
			if (command.hasOwnProperty('description')) {
				if (typeof command.usage === 'string' && typeof command.description === 'string') {
					helpText += getHelpRow(commandString, command.usage, command.description);
				} else if (command.usage instanceof Array && command.description instanceof Array) {
					if (command.usage.length === command.description.length) {
						for (let i = 0; i < command.usage.length; i++) {
							helpText += getHelpRow(commandString, command.usage[i], command.description[i]);
						}
					} else common.warn(`Lengths of usage and description properties of command '${commandString}' do not match.`);
				} else common.warn(`Types of usage and description properties of command '${commandString}' do not match.`);
			} else {
				if (typeof command.usage === 'string') {
					helpText += getHelpRow(commandString, command.usage);
				} else if (command.usage instanceof Array) {
					for (let i = 0; i < command.usage.length; i++) {
						helpText += getHelpRow(commandString, command.usage[i]);
					}
				}
				common.info(`Command '${commandString}' has usage property, but no description property.`)
			}
		} else if (!(command.hasOwnProperty('args') && command.args)) common.info(`Command '${commandString}' doesn't have a usage property.`);

		if (command.hasOwnProperty('sub')) {
			let subs = command.sub;
			for (let sub in subs) {
				if (!subs.hasOwnProperty(sub)) continue;
				helpText += getCommandHelp(subs[sub], localCommandChain);
			}
		}
		return helpText;
	}
};