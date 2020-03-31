const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class ConfigHandler extends ClientBasedHandler {

    path;

    constructor(client, path) {
        super(client);
        this.path = path;
    }
        
    setDefaultValue(property, value) {
        if (!this.client.config.hasOwnProperty(property)) this.client.config[property] = value;
    }
        
    save() {
        this.client.fileHandler.save(this.path, this.client.config);
    }

    load() {
        // CONFIG LOADING
        this.client.config = this.client.fileHandler.load(this.path);
        
        this.setDefaultValue('prefix', '!');
        this.setDefaultValue('debug', false);
        this.setDefaultValue('ownerId', null);
        this.setDefaultValue('badWordFilter', false);
        this.setDefaultValue('devMode', false);
        this.setDefaultValue('devToken', null);
        
        if (!this.client.fileHandler.exists(this.path)) {
            this.client.fileHandler.save(this.path, this.client.config);
            this.client.logger.info('Please configure the bot with your credentials inside ' + this.path + '.');
            process.exit(1);
        }
        
        // CHECK REQUIRED VALUES AND EXIT IF NECESSARY
        let canRunBot = true;
        
        if (this.client.config.token === null) {
            this.client.logger.warn('Property \'token\' missing in config.json!');
            canRunBot = false;
        }
        
        if (this.client.config.ownerId === null) {
            this.client.logger.warn(
                'Property \'ownerId\' missing in config.json! Please fill in the ID of your discord user.' + '\n' +
                'Without an ownerId it is not possible to perform actions that require a bot superuser.'
            );
        }
        if (this.client.config.devMode === true && this.client.config.devToken === null) {
            this.client.logger.warn('Property \'devMode\' is enabled, but a \'devToken\' is missing in config.json!' + '\n' +
            'Add a \'devToken\' or disable \'devMode\'.'
            );
            canRunBot = false;
        }
        
        if (!canRunBot) process.exit(1);
    }

}

module.exports = ConfigHandler;
