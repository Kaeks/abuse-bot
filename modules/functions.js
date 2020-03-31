const Discord = require.main.require('./discordjs_amends');

const util = require.main.require('./util');

const enums = require.main.require('./enum');
const { permissionLevels, argumentValues, colors, serverFeatures } = enums;

module.exports = client => {
    /**
    * Taken from https://github.com/AnIdiotsGuide/guidebot/
    * Sanitizes bot outputs, removing the client's token from messages etc.
    * 
    * @param client
    * @param text
    * @returns {String}
    */
    client.clean = async (client, text) => {
        if (text && text.constructor.name == "Promise")
        text = await text;
        if (typeof text !== "string") {
            text = require("util").inspect(text, {depth: 1});
        }
        
        text = text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203))
        .replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");
        
        return text;
    };
    
    client.getMessages = async (channel, filter, start, collection = new Discord.Collection()) => {
        client.logger.debug('Getting messages...');
        let options = {
            limit : 100
        };
        if (start) options.before = start;
        let request = await channel.fetchMessages(options);
        if (filter) request = request.filter(filter);
        let newCollection = collection.concat(request);
        
        let str = 'Request size:';
        for (let i = 0; i < 4 - request.size.toString().length; i++) {
            str += ' ';
        }
        str +=  request.size + ' Current size: ' + newCollection.size;
        client.logger.debug(str);
        
        if (request.size === 0) {
            client.logger.log('Done! Total size: ' + newCollection.size);
            return newCollection;
        }
        return client.getMessages(channel, filter, request.last().id, newCollection);
    }
    
    /**
    * Returns whether or not a user is blocked from using bot features.
    * @param user
    * @returns {boolean}
    */
    client.isBlocked = user => {
        return client.blockedUsers.includes(user.id);
    }
    
    /**
    * Returns whether or not a message is to be handled as a command by the bot.
    * @param msg
    * @returns {boolean}
    */
    client.isCommand = msg => {
        // Check whether the message was issued by another user
        if (msg.author === client.user) return false;
        // Check whether the message starts with the bot's prefix
        if (!msg.content.startsWith(client.config.prefix)) return false;
        
        const split = msg.content.slice(client.config.prefix.length).split(/ +/);
        const commandName = split[0].toLowerCase();
        return client.commands.has(commandName);
    }
    
    /**
    * Sets up database space for a server
    * @param server
    */
    client.setUpServer = async (server) => {
        if (!client.data.servers.hasOwnProperty(server.id)) {
            client.data.servers[server.id] = {};
            client.logger.log('Added \'' + server.name + '\' to server list.');
        }
        let serverEntry = client.data.servers[server.id];
        if (!serverEntry.hasOwnProperty('channels')) {
            serverEntry.channels = {};
            client.logger.log('Added \'channels\' property to \'' + server.name + '\'.');
        }
        if (!serverEntry.hasOwnProperty('roles')) {
            serverEntry.roles = {};
            client.logger.log('Added \'roles\' property to \'' + server.name + '\'.');
        }
        if (!serverEntry.roles.hasOwnProperty('owner')) {
            let role;
            let foundRole = findServerOwnerRole(server);
            if (foundRole !== undefined && foundRole != null) {
                role = foundRole;
            } else {
                try {
                    role = await server.createRole({
                        name : roleNames.SERVER_OWNER,
                        color : 'GREY',
                        mentionable : false
                    }, 'Wiktor Bot per-server permission system role setup.');
                } catch(e) {
                    // error
                    console.error();
                }
            }
            if (role !== undefined) {
                serverEntry.roles.owner = role.id;
                client.logger.log('Added server owner role to \'' + server.name + '\'.');
            }
        }
        if (!serverEntry.roles.hasOwnProperty('superuser')) {
            let role;
            let foundRole = findServerSuperUserRole(server);
            if (foundRole !== undefined && foundRole != null) {
                role = foundRole;
            } else {
                try {
                    role = await server.createRole({
                        name : roleNames.SERVER_SUPERUSER,
                        color : 'GREY',
                        mentionable : false
                    }, 'Wiktor Bot per-server permission system role setup.');
                } catch (e) {
                    // error
                    console.error(e);
                }
            }
            if (role !== undefined) {
                serverEntry.roles.superuser = role.id;
                client.logger.log('Added server superuser role to \'' + server.name + '\'.');
            }
        }
        if (!serverEntry.hasOwnProperty('disabledFeatures')) {
            serverEntry.disabledFeatures = [];
            client.logger.log('Added \'disabledFeatures\' property to \'' + server.name + '\'.');
        }
        client.dataHandler.save();
    }
    
    /**
    * Gets a collection of real users (i.e. without bot users)
    * @returns {Collection}
    */
    client.getUsers = () => {
        return client.users.filter(user => {
            return user.bot === false
        });
    }
    
    /**
    * Returns the database entry of the server
    * @returns {Object}
    */
    client.getServerDbEntry = server => {
        if (!client.data.servers.hasOwnProperty(server.id)) throw 'Server with id ' + server.id + 'doesn\'t have an entry.';
        return client.data.servers[server.id];
    }
    
    /**
    * Enables a feature
    * @param server
    * @param feature
    */
    client.enableServerFeature = (server, feature) => {
        let serverEntry = client.getServerDbEntry(server);
        if (!serverEntry.disabledFeatures.includes(feature)) {
            serverEntry.disabledFeatures.push(feature);
        }
        client.dataHandler.save();
    }
    
    /**
    * Disables a feature
    * @param server
    * @param feature
    */
    client.disableServerFeature = (server, feature) => {
        let serverEntry = client.getServerDbEntry(server);
        serverEntry.disabledFeatures = serverEntry.disabledFeatures.filter(value => {
            return value !== feature;
        });
        client.dataHandler.save();
    }
    
    /**
    * Returns whether or not the user is a member of the water club
    * @returns {boolean}
    */
    client.userIsWaterMember = user => {
        return !(client.data.users[user.id] === undefined || client.data.users[user.id].water === undefined || client.data.users[user.id].water.enabled !== true);
    }
    
    /**
    * Returns the database entry of the user
    * @param user
    * @returns {Object}
    */
    client.getUserDbEntry = user => {
        if (!client.data.users.hasOwnProperty(user.id)) throw 'User ' + user.getHandle() + 'doesn\'t have an entry.';
        return client.data.users[user.id];
    }
    
    /**
    * Gets channel of a channel entry
    * @param {Object} channelEntry 
    * @returns {Channel}
    */
    client.getChannelOfEntry = async channelEntry => {
        let channel; 
        if (!client.channels.has(channelEntry.id)) {
            if (channelEntry.type !== 'dm') {
                throw 'I don\'t have the channel with id \'' + channelEntry.id + '\' cached.';
            }
            if (!channelEntry.hasOwnProperty('recipient')) {
                throw 'The channel with id \'' + channelEntry.id + '\' is a DM channel but has no recipient.';
            }
            let recipientId = channelEntry.recipient.id;
            let user = client.users.get(recipientId);
            channel = await user.getDmChannel();
        } else {
            channel = client.channels.get(channelEntry.id);
        }
        return channel;
    }

    /**
     * Fetches a message from a channel
     * @param {Snowflake} msgId 
     * @param {Channel} channel 
     */
    client.getMessageInChannel = async (msgId, channel) => {
        try {
            return await channel.fetchMessage(msgId);
        } catch (e) {
            client.logger.info('Tried to find message with id ' + msgId + ' inside channel with id ' + channel.id + ' but couldn\'t find anything.');
        }
    }
    
    /**
    * Gets a message in a channel entry
    * @param {Snowflake} msgId
    * @param {Object} channelEntry
    * @returns {Promise<*>}
    */
    client.getMessageInChannelEntry = async (msgId, channelEntry) => {
        let channel = await client.getChannelOfEntry(channelEntry);
        return await client.getMessageInChannel(msgId, channel);
    }
    
    /**
    * Looks for a role with a specific name on a server
    * @param server
    * @param {String} roleName
    * @return {*}
    */
    client.findServerRoleFromName = (server, roleName) => {
        return server.roles.find(role => role.name === roleName);
    }
    
    /**
    * Looks for an existing Wiktor server owner role
    * @param server
    * @return {*}
    */
    client.findServerOwnerRole = server => {
        return findServerRoleFromName(server, roleNames.SERVER_OWNER);
    }
    
    /**
    * Looks for an existing Wiktor server superuser role
    * @param server
    * @return {*}
    */
    function findServerSuperUserRole(server) {
        return findServerRoleFromName(server, roleNames.SERVER_SUPERUSER);
    }
    
    /**
    * Sets up database space for a user
    * @param msg
    * @param user
    */
    client.setUpUser = (msg, user) => {
        if (!client.data.users.hasOwnProperty(user.id)) {
            client.logger.log('Added \'' + user + '\' to user list.');
            client.data.users[user.id] = {};
        }
        client.data.users[user.id].wednesday = client.data.users[user.id].wednesday || {};
        client.data.users[user.id].water = client.data.users[user.id].water || {};
        
        const text = `Hey, ${user}! This seems to be your first time interacting with me. ` +
        `Make sure to enable DMs from users on this server to be able to ` +
        `receive personal messages used for a variety of my functions.`;
        
        msg.channel.send(text);
        client.dataHandler.save();
    }
    
    /**
    * Returns the user instance of the owner of the bot, as specified inside `config.json`
    * @returns {User}
    */
    client.getOwner = () => {
        return client.users.get(client.config.ownerId);
    }
    
    /**
    * Updates the status and presence of the bot
    * @param {Discord.PresenceStatus} status
    * @param {String} name
    * @param {Discord.ActivityType} type
    * @param {String} url
    * @param {boolean} afk
    */
    client.updatePresence = (
        status = 'online',
        name = client.config.prefix + 'help',
        type = 'LISTENING',
        url = 'https://www.github.com/Kaeks/wiktor-bot',
        afk = false
    ) => {
        client.user.setPresence({
            status: status,
            afk: afk,
            game: {
                name: name,
                url: url,
                type: type,
            }
        }).catch(console.error);
    }
    
    /**
    * Get the permission level of a user, located where the message is located
    * @param {User} user 
    * @param {Message} msg 
    * @returns {Number}
    */
    client.getUserPermissionLevel = (user, msg) => {
        if (user === client.getOwner()) return permissionLevels.BOT_OWNER;
        let dbEntry = client.getUserDbEntry(user);
        if (dbEntry.permissionLevel) return dbEntry.permissionLevel;
        let channel = msg.channel;
        if (channel.type === 'text') {
            let server = msg.channel.guild;
            let serverDbEntry = client.getServerDbEntry(server);
            let serverOwnerRole = server.roles.get(serverDbEntry.roles.owner);
            let serverSuperUserRole = server.roles.get(serverDbEntry.roles.superuser);
            let member = msg.member;
            if (member.roles.has(serverOwnerRole.id)) return permissionLevels.SERVER_OWNER;
            if (member.roles.has(serverSuperUserRole.id)) return permissionLevels.SERVER_SUPERUSER;
        }
        return permissionLevels.NONE;
    }
    
    /**
    * Helper method for getting command help.
    * @param {Command} command
    * @param {String} usage
    * @param {String} description
    * @returns {string}
    */
    client.getHelpRow = (command, usage, description = '') => {
        let base = '`' + client.config.prefix + util.combineCommandChain(command.getCommandChain()) + ' ' + usage + '`' + '\n';
        return description === '' ? base : base + '> ' + description + '\n';
    }
    
    /**
    * Returns a list of possible uses of a command as a string
    * @param command
    * @returns {string}
    */
    client.getCommandHelp = command => {
        let helpText = '';
        for (let docEntry of command.doc) {
            helpText+= client.getHelpRow(command, docEntry.usage, docEntry.description);
        }
        if (command.sub.size > 0) {
            command.sub.forEach(subCommand => {
                helpText += client.getCommandHelp(subCommand);
            });
        }
        return helpText;
    }
    
    /**
    * Returns an embed with *all* commands to the author of the message
    * @param msg
    * @param embed
    */
    client.getFullHelpEmbed = (msg, embed) => {
        const { commands } = msg.client;
        commands.forEach(command => {
            embed.addField(command.name, client.getCommandHelp(command))
        });
    }
    
    
    /**
    * Get the name of the command in the message.
    * @param {Discord.Message} msg
    * @returns {String} the name of the command in the message
    */
    client.getCommandName = msg => {
        const split = msg.content.slice(client.config.prefix.length).split(/ +/);
        return split[0].toLowerCase();
    }
    
    /**
    * Recursive function to execute a command - sub-command chain
    * @param msg
    * @param suffix
    * @param command
    * @returns {Command} the executed subCommand
    */
    client.findSubCommand = (msg, suffix, command) => {
        // Variable for determining whether a (sub-)command can be executed with the suffix or not
        let isValidUse = false;
        
        if (suffix == null) {
            // Suffix is empty
            // Command doesn't require arguments ✔
            // Command doesn't have a standalone function ✔
            if (![argumentValues.REQUIRED, argumentValues.NULL].includes(command.args)) isValidUse = true;
        } else {
            // Suffix is not empty
            // Get a list of individual (possible) sub-commands
            let splitList = suffix.split(/ +/);
            let firstArg = splitList[0];
            
            // If there is a sub-command, go through to it and look recursively
            // If there is no sub-command and the current command accepts / requires arguments, continue with execution
            if (command.sub.has(firstArg)) {
                let temp = suffix.substring(firstArg.length);
                let match = temp.match(/ +/);
                let subCommand = command.sub.get(firstArg);
                
                let user = msg.author;
                
                if (client.getUserPermissionLevel(user, msg) < subCommand.permissionLevel) {
                    client.logger.debug('User ' + user.getHandle() + ' does not have the required permission level for that sub-command.');
                    msg.channel.send('I\'m sorry, ' + user + ', you do not have permission to execute that sub-command.');
                    return null;
                }
                
                let newSuffix = match !== null ? temp.substring(match[0].length) : null;
                
                return client.findSubCommand(msg, newSuffix, subCommand);
            } else if (command.args === argumentValues.REQUIRED || command.args === argumentValues.OPTIONAL) {
                isValidUse = true;
            }
        }
        
        // If the use is valid, execute it
        // If the use is not valid, display help
        let commandString = util.combineCommandChain(command.getCommandChain());
        if (isValidUse) {
            let suffixString = suffix == null ? '' : ' with suffix: \'' + suffix + '\'';
            client.logger.log('User ' + msg.author.getHandle() + ' issued command \'' + commandString + '\'' + suffixString + '.');
            if (command.hasOwnProperty('execute')) {
                command.execute(msg, suffix);
                return command;
            } else {
                client.logger.warn('Command \'' + commandString + '\' has not been implemented.');
                let embed = new Discord.RichEmbed()
                .setColor(colors.RED)
                .setTitle('Not available!')
                .setDescription('The command `' + client.config.prefix + commandString + '` doesn\'t have an implemented function.');
                msg.channel.send({ embed: embed });
                return null;
            }
        } else {
            let embed = new Discord.RichEmbed()
            .setColor(colors.GREEN)
            .setTitle('Help for ' + commandString);
            embed.setDescription(client.getCommandHelp(command));
            msg.channel.send({ embed: embed });
        }
        return null;
    }
    
    /**
    * Handles a command inside a message
    * @param msg
    * @returns {Command} the executed command
    */
    client.handleCommand = msg => {
        let user = msg.author;
        // Filter out blocked users
        if (client.isBlocked(user)) {
            client.logger.debug('User ' + user.getHandle() + ' is on blocked user list.');
            msg.channel.send('I\'m sorry, ' + user + ', you\'ve been blocked from using me.');
            return null;
        }
        
        // Create database space for the message author
        if (!client.data.users.hasOwnProperty(user.id)) client.setUpUser(msg, user);
        
        const commandName = client.getCommandName(msg);
        client.logger.debug('commandName: ' + commandName);
        const command = client.commands.get(commandName);
        
        let commandPermissionLevel = command.permissionLevel || permissionLevels.NONE;
        
        if (client.getUserPermissionLevel(user, msg) < commandPermissionLevel) {
            client.logger.debug('User ' + user.getHandle() + ' does not have the required permission level for that command.');
            msg.channel.send('I\'m sorry, ' + user + ', you do not have permission to execute that command.');
            return null;
        }
        
        let temp = msg.content.substring(client.config.prefix.length + commandName.length);
        let match = temp.match(/ +/);
        
        const suffix = match !== null ? temp.substring(match[0].length) : null;
        client.logger.debug('suffix: ' + suffix);
        try {
            return client.findSubCommand(msg, suffix, command);
        } catch (e) {
            console.error(e.stack);
            let embed = new Discord.RichEmbed()
            .setColor(colors.RED)
            .setTitle('Internal Error!')
            .setDescription('Command `' + commandName + '` failed.');
            msg.channel.send({ embed: embed });
        }
        return null;
    }

    function parseTimeSnippet(value, text, last = false) {
        return value ? + ' ' + text + (value > 1 ? 's' : '') + !last ? ' ' : '' : ''
    }

    client.logTimeTaken = (ms) => {
        let seconds = Math.floor(ms / 1000);
        let newMs = ms - seconds * 1000;
        let minutes = Math.floor(seconds / 60);
        let newSeconds = seconds - minutes * 60;
        let hours = Math.floor(minutes / 60);
        let newMinutes = minutes - hours * 60;
    
        let hourString = parseTimeSnippet(hours, 'hour');
        let minuteString = parseTimeSnippet(newMinutes, 'minute');
        let secondString = parseTimeSnippet(newSeconds, 'second');
        let msString = parseTimeSnippet(newMs, 'millisecond');
    
        client.logger.log(`Time taken: ${hourString}${minuteString}${secondString}${msString}.`);
    }

    /**
     * Finds the recipient of a DM channel
     * @param dmChannelId
     * @returns {Promise<*>}
     */
    client.findRecipientOfDmChannelId = async (dmChannelId) => {
        let dmChannels = new Discord.Collection();
    
        let users = client.getUsers();
    
        for (const userEntry of users) {
            let user = userEntry[1];
            let dmChannel = await user.getDmChannel();
            dmChannels.set(dmChannel.id, dmChannel);
        }
    
        if (!dmChannels.has(dmChannelId)) {
            throw 'DM channel with id \'' + dmChannelId + '\' could not be found.';
        }
    
        return dmChannels.get(dmChannelId).recipient;
    }

    client.findMessageWithId = async (msgId) => {
        let textChannels = client.channels.filter(channel => { return channel.type === 'text'; });
        let groupChannels = client.channels.filter(channel => { return channel.type === 'group'; });
        let users = client.getUsers();
        let dmChannels = new Discord.Collection();
        for (const userEntry of users) {
            let user = userEntry[1];
            let dmChannel = await user.getDmChannel();
            dmChannels.set(dmChannel.id, dmChannel);
        }
        let channels = textChannels.concat(dmChannels, groupChannels);
        for (const channelEntry of channels) {
            let channel = channelEntry[1];
            try {
                return await channel.fetchMessage(msgId);
            } catch (e) {
                client.logger.debug('This ain\'t it, chief.');
            }
        }
    }
    
    /**
     * Gets the fixed shorthand message entry for a messageId
     * This is used to convert an entry that is just a messageId into a usable entry
     * @param msgId
     * @returns {Promise<{channel: {id: *, type: *}, id: *}>}
     */
    client.getFixedMessage = async (msgId) => {
        let message = await client.findMessageWithId(msgId);
    
        let fixedMessage = {
            id : message.id,
            channel : {
                id : message.channel.id,
                type : message.channel.type
            }
        };
        if (message.channel.type === 'dm') {
            fixedMessage.channel.recipient = {
                id : message.channel.recipient.id
            };
        }
        client.logger.debug('Got fixed message entry for message with id \'' + msgId + '\'.');
        return fixedMessage
    }

    /**
     * Handles a reaction event
     */
    client.handleReaction = (messageReaction, user, event) => {
        if (user.bot) return false;
        let message = messageReaction.message;
        
        let listeners = client.reactionListenerHandler.reactionListeners;
        listeners.forEach(listener => {
            // Check if the message is being listened to and the reaction is accepted
            if (message.id === listener.msgId) {
                if (listener.reactions.includes(messageReaction.emoji.name)) {
                    listener.fn(messageReaction, user, event);
                }
            }
        });
    }
}
