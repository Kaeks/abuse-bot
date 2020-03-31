const fs = require('fs');

const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class FileHandler extends ClientBasedHandler {

    constructor(client) {
        super(client);
    }

    /**
     * Checks whether a file exists
     * @param {String} filePath
     * @returns {boolean}
     */
    exists(filePath) {
        try {
            return fs.existsSync(filePath);
        } catch (err) {
            console.error(err);
        }
        return false;
    }

    /**
     * Loads a file and creates it in case it does not exist
     * @param {String} filePath
     * @returns {*}
     */
    load(filePath) {
        let temp;
        try {
            temp = require.main.require(filePath);
            this.client.logger.debug('Read ' + filePath);
        } catch (e) {
            this.client.logger.warn('Attempted to read nonexistent file ' + filePath);
        }
        return temp;
    }

    /**
     * Saves a file using a variable
     * @param {String} filePath
     * @param {Object} variable
     */
    save(filePath, variable) {
        let existed = this.exists(filePath);
        fs.writeFileSync(filePath, JSON.stringify(variable, null, 2));
        if (!existed) {
            this.client.logger.info('Created ' + filePath);
        }
    }

}

module.exports = FileHandler;
