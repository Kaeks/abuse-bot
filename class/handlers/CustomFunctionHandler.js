const Discord = require.main.require('./discordjs_amends')
const util = require.main.require('./util');

const CustomFunction = require.main.require('./class/CustomFunction');
const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class CustomFunctionHandler extends ClientBasedHandler {

    path;
    customFunctions;

    constructor(client, path) {
        super(client);
        
        this.path = path;
        this.customFunctions = new Discord.Collection();
    }

    readAll() {
        this.client.logger.debug('Reading custom functions...');

        let rawCustomFunctions;
        if (!this.client.fileHandler.exists(this.path)) {
            rawCustomFunctions = [];
            this.client.fileHandler.save(this.path, rawCustomFunctions);
        } else {
            rawCustomFunctions = this.client.fileHandler.load(this.path);
        }

        let collection = new Discord.Collection();
        for (let customFunctionEntry of rawCustomFunctions) {
            let jsonCustomFunction = customFunctionEntry[1];

            let name = jsonCustomFunction.name;
            let fn = jsonCustomFunction.fn;
            let creator = this.client.users.get(jsonCustomFunction.creator);
            let date = new Date(jsonCustomFunction.date);
            let executions = jsonCustomFunction.executions;

            let customFunction = new CustomFunction(name, fn, creator, date, executions);
            collection.set(name, customFunction);
        }
        this.client.logger.debug('Done!');
        return collection;
    }

    loadAll() {
        let collection = this.readAll();
        collection.forEach(customFunction => this.add(customFunction));
        this.client.logger.debug('Loaded all custom functions.');
    }

    formatAll() {
        let shortCustomFunctions = new Discord.Collection();
        this.customFunctions.forEach(customFunction => {
            shortCustomFunctions.set(customFunction.name, {
                name: customFunction.name,
                fn: customFunction.fn,
                creator: customFunction.creator.id,
                date: customFunction.date,
                executions: customFunction.executions
            })
        });
        return shortCustomFunctions;
    }

    add(customFunction) {
        this.customFunctions.set(customFunction.name, customFunction);
        this.saveAll();
    }

	delete(customFunction) {
        let name = customFunction.name;
		if (!this.customFunctions.delete(name)) {
            throw 'Custom function with name \'' + name + '\' could not be removed from collection.';
        }
        this.saveAll();
		return true;
	}

    saveAll()	{
        this.client.fileHandler.save(this.path, Array.from(this.formatAll()))
    }

    /**
     * Deletes all custom functions
     */
    deleteAll() {
        this.customFunctions.deleteAll();
        this.saveAll();
        return true;
    }

	async execute(customFunction, msg) {
		let result = customFunction.execute();
        this.saveAll();
        return result;
	}
}

module.exports = CustomFunctionHandler;
