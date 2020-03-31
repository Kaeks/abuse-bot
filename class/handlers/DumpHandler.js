const util = require.main.require('./util');
const fs = require('fs');

const enums = require.main.require('./enum');
const { dumpTypes } = enums;

const Dump = require.main.require('./class/Dump');
const ClientBasedHandler = require.main.require('./class/handlers/ClientBasedHandler');

class DumpHandler extends ClientBasedHandler {

    path;

    constructor(client, path = 'dumps') {
        super(client);
        this.path = path;
    }

    async createDump(msg, suffix, type) {
        if (Object.values(dumpTypes).indexOf(type) === -1) throw `Invalid type ${type}.`;
        if (type === dumpTypes.DM) {
            let user = suffix == null ? msg.author : this.client.users.get(suffix);
            let channel = await user.getDmChannel();
            let dump = new Dump(msg, channel);
            await this.generate(dump);
            this.writeDump(dump, 'dm/' + user.id);
        } else if (type === dumpTypes.CHANNEL) {
            let channel = suffix == null ? msg.channel : this.client.channels.get(suffix);
            let dump = new Dump(msg, channel);
            await this.generate(dump);
            this.writeDump(dump, 'channel/' + channel.id);
        } else if (type === dumpTypes.SERVER) {
            let server = suffix == null ? msg.guild : this.client.guilds.get(suffix);
            let dumps = await this.getServerDumps(msg, server);
            for (let dump of dumps) {
                this.writeDump(dump, 'server/' + server.id);
            }
        } else if (type === dumpTypes.ALL) {
            await this.createFullDump(msg);
        }
    }
    
    async createFullDump(msg) {
        this.client.logger.info('Creating full dump of all channels!');
        let before = new Date();
        let dumpDirectory = 'full/' + util.generateDateFileName(before) + '/';
    
        let msgAmt = 0;
    
        // Get all users
        let users = this.client.getUsers();
        // -> Cache all available DM channels
        for (let userEntry of users) {
            let user = userEntry[1];
            let dmChannel = await user.getDmChannel();
            let dump = new Dump(msg, dmChannel);
            await this.generate(dump);
            this.writeDump(dump, dumpDirectory + 'dm/' + user.id);
            msgAmt += dump.messages.length;
        }
    
        // Get all group DMs
        let groupDmChannels = this.client.channels.filter(channel => {return channel.type === 'group'});
        for (let groupDmChannelEntry of groupDmChannels) {
            let groupDmChannel = groupDmChannelEntry[1];
            let dump = new Dump(msg, groupDmChannel);
            await this.generate(dump);
            this.writeDump(dump, dumpDirectory + 'group/' + groupDmChannel.id);
            msgAmt += dump.messages.length;
        }
    
        let serverChannelAmt = 0;
    
        // Get all servers
        let servers = this.client.guilds;
        for (let serverEntry of servers) {
            let server = serverEntry[1];
            let dumps = await this.getServerDumps(msg, server);
            serverChannelAmt += dumps.length;
            for (let dump of dumps) {
                this.writeDump(dump, dumpDirectory + 'server/' + server.id);
                msgAmt += dump.messages.length;
            }
        }
    
        let dmAmt = users.size;
        let groupAmt = groupDmChannels.size;
        let serverAmt = servers.size;
    
        this.client.logger.log('Done! Servers: ' + serverAmt + ' with ' + serverChannelAmt + ' channels, Groups: ' + groupAmt + ', DMs: ' + dmAmt);
        this.client.logger.log('Total channels: ' + (dmAmt + groupAmt + serverChannelAmt));
        this.client.logger.log('Grand total of messages: ' + msgAmt);
    
        let after = new Date();
        let timeDiff = after - before;
        this.client.logTimeTaken(timeDiff);
    
        this.client.logger.log((msgAmt / (timeDiff / 1000)).toFixed(2) + ' messages per second.');
    }
    
    async getServerDumps(msg, server) {
        this.client.logger.info('Creating dump for server \'' + server + '\' (' + server.id + ')');
        let filtered = server.channels.filter(val => {
            return val.type === 'text'
        });
        let before = new Date();
        let msgCounter = 0;
        let dumps = [];
        for (const channelEntry of filtered) {
            let channel = channelEntry[1];
            let dump = new Dump(msg, channel);
            await this.generate(dump);
            msgCounter += dump.messages.length;
            dumps.push(dump);
        }
        this.client.logger.log('Done! Channels: ' + filtered.size + ', Total messages: ' + msgCounter);
        let after = new Date();
        let timeDiff = after - before;
        this.client.logTimeTaken(timeDiff);
        this.client.logger.log((msgCounter / (timeDiff / 1000)).toFixed(2) + ' messages per second.');
        return dumps;
    }

    writeDump(dump, subDir = '') {
        let name = dump.generateFileName();
        let fullDirPath = this.path + '/' + subDir;
        let path = fullDirPath + '/' + name;
        this.client.logger.info('New dump created at \'' + path + '\'!');
        fs.mkdirSync(fullDirPath, {recursive: true});
        this.client.fileHandler.save(path, dump.format());
    }
    
    async getShortenedMessages(channel, filter) {
        let request = await this.client.getMessages(channel, filter);
    
        let list = [];
    
        request.forEach(message => {
    
            let shortened = {
                author : message.author.getHandle(),
                content : message.content,
                attachments : []
            };
    
            if (message.attachments.size > 0) {
                let shortenedAttachments = [];
                message.attachments.forEach(value => {
                    shortenedAttachments.push(
                        {
                            id: value.id,
                            filename: value.filename,
                            url: value.url,
                            proxyURL: value.proxyURL
                        }
                    );
                });
                shortened.attachments = shortenedAttachments;
            }
    
            list.push(shortened);
        });
    
        return list;
    }

    async generate(dump) {
        let before = new Date();
        dump.messages = await this.getShortenedMessages(dump.channel);
        let after = new Date();
        let timeDiff = after - before;
        this.client.logTimeTaken(timeDiff);
        this.client.logger.log((dump.messages.length / (timeDiff / 1000)).toFixed(2) + ' messages per second.');
    }

}

module.exports = DumpHandler;
