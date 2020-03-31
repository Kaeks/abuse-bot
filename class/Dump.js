const Discord = require.main.require('./discordjs_amends');
const util = require.main.require('./util');

class Dump {

    issued;
    channel;
    messages;

    constructor(issueMessage, targetChannel) {
        if (!['dm', 'group', 'text'].includes(targetChannel.type)) throw 'Channel is not a text based channel.';

        this.issued = {
            on: new Date(),
            in: issueMessage.channel,
            by: issueMessage.author
        }
        this.channel = targetChannel;
        this.messages = new Discord.Collection();
    }

    getChannelInfo() {
        let channelInfo = {};
        if (this.channel.type === 'dm') {
            let handle = this.channel.recipient.getHandle();
            channelInfo.recipient = {
                handle : handle,
                id : this.channel.recipient.id
            }
        } else if (this.channel.type === 'text') {
            channelInfo.name = this.channel.name;
            channelInfo.server = {
                id : this.channel.guild.id,
                name : this.channel.guild.name
            }
        }
        return channelInfo;
    }

    format() {
        return {
            issued: {
                on: this.issued.on,
                in: {
                    id: this.issued.in.id,
                    type: this.issued.in.type
                },
                by: {
                    handle: this.issued.by.getHandle(),
                    id: this.issued.by.id
                }
            },
            channel: {
                id: this.channel.id,
                type: this.channel.type,
                info: this.getChannelInfo()
            },
            messages: this.messages
        }
    }
    
    generateFileName() {
	    return `dump_${this.channel.type}${this.channel.id}_${util.generateDateFileName(this.issued.on)}.json`
    }

}

module.exports = Dump;
