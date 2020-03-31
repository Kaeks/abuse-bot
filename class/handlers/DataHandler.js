const ClientBasedHandler = require('./ClientBasedHandler');

class DataHandler extends ClientBasedHandler {
    path;

    constructor(client, path) {
        super(client);
        this.path = path;
    }

    load() {
        this.client.data = this.client.fileHandler.load(this.path);
        
        this.client.data.servers = this.client.data.servers || {};
        this.client.data.users = this.client.data.users || {};
    }

    save() {
        this.client.fileHandler.save(this.path, this.client.data);
    }
}

module.exports = DataHandler;
