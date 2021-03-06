const Discord = require.main.require('./discordjs_amends');
const enums = require.main.require('./enum');

class CustomFunction {
	name;
	fn;
	creator;
	date;
	executions;

	constructor(name, fn, creator, date = new Date(), executions = 0) {
		this.name = name;
		this.fn = fn;
		this.creator = creator;
		this.date = date;
		this.executions = executions
	}

	async execute(msg) {
		this.executions++;
		return eval(this.fn);
	}
}

module.exports = CustomFunction;
