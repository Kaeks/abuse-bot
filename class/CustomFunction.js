const common = require('../common');
const enums = require('../enum');

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

	delete() {
		if (!common.customFunctions.delete(this.name)) throw 'Custom function with name \'' + this.name + '\' could not be removed from collection.';
		common.saveCustomFunctions();
		return true;
	}

	async execute(msg) {
		this.executions++;
		common.saveCustomFunctions();
		return eval(this.fn);
	}
}

module.exports = CustomFunction;