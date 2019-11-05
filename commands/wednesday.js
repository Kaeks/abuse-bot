const common = require('../common.js');
const {
	Storage,
	saveData,
	sendWednesday
} = common;
const Discord = require('discord.js');

module.exports = {
	name : 'wednesday',
	args : common.argumentValues.OPTIONAL,
	sub : [
		{
			name : 'enable',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Enable Wednesday posting.',
			execute (msg) {
				if (checkDmOrGroup(msg)) {
					msg.channel.send('Cannot be used in (group) DMs.').then((message => message.delete(5000)));
					return false;
				}
				let server = msg.guild.id;
				Storage.servers[server].disabledFeatures.wednesday = false;
				msg.channel.send('Wednesdaily frog has been enabled. :frog:');

			}
		},
		{
			name : 'disable',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Enable/disable Wednesday posting.',
			execute (msg) {
				if (checkDmOrGroup(msg)) {
					msg.channel.send('Cannot be used in (group) DMs.').then((message => message.delete(5000)));
					return false;
				}
				let server = msg.guild.id;
				Storage.servers[server].disabledFeatures.wednesday = true;
				msg.channel.send('Wednesdaily frog has been disabled. <:tairaOOF:455716045987250186>');
				saveData();
			}
		},
		{
			name : 'channel',
			args : common.argumentValues.OPTIONAL,
			sub : [
				{
					name : 'set',
					args : common.argumentValues.OPTIONAL,
					usage : '[textChannel]',
					description : 'Set channel for Wednesdays.',
					execute (msg) {
						if (checkDmOrGroup(msg)) {
							msg.channel.send('Cannot be used in (group) DMs.').then((message => message.delete(5000)));
							return false;
						}
						let server = msg.guild.id;
						let channel;
						if (args[2]) {
							channel = msg.mentions.channels.first();
						} else {
							channel = msg.channel;
						}
						Storage.servers[server].channels = Storage.servers[server].channels || {};
						Storage.servers[server].channels.wednesday = channel.id;
						msg.channel.send('Channel for Wednesdays has been set to ' + channel);
						saveData();
					}
				}
			],
			usage : '',
			description : 'View channel for Wednesdays.',
			execute (msg) {
				if (checkDmOrGroup(msg)) {
					msg.channel.send('Cannot be used in (group) DMs.').then((message => message.delete(5000)));
					return false;
				}
				let server = msg.guild.id;
				let channelID = Storage.servers[server].channels.wednesday;
				let channel = msg.client.channels.get(channelID);
				msg.channel.send('Channel for Wednesdays is ' + channel);
			}
		},
		{
			name : 'subscribe',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Subscribe to the private Wednesday service.',
			execute (msg) {
				let author = msg.author.id;
				if (Storage.users[author].wednesday === true) {
					msg.channel.send('You are already subscribed to the private Wednesday service.');
				} else {
					Storage.users[author].wednesday = true;
					msg.channel.send('You are now subscribed to the private Wednesday service.');
					saveData();
				}
			}
		},
		{
			name : 'unsubscribe',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Unsubscribe from the private Wednesday service.',
			execute (msg) {
				let author = msg.author.id;
				if (Storage.users[author].wednesday === true) {
					Storage.users[author].wednesday = false;
					msg.channel.send('You are no longer subscribed to the private Wednesday service.');
					saveData();
				} else {
					msg.channel.send('You are not subscribed to the private Wednesday service.');
				}
			}
		},
		{
			name : 'test',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Simulate a Wednesday.',
			execute (msg) {
				let author = msg.author.id;
				if (msg.channel.type === 'dm' || msg.channel.type === 'group') {
					if (Storage.users[author].wednesday === true) {
						sendWednesday(client.users.get(author).dmChannel.id);
					} else {
						msg.channel.send('You need to subscribe to the Wednesday frog service first.');
					}
				}
				if (msg.channel.type === 'text') {
					let server = msg.guild.id;
					if (Storage.servers[server].channels.hasOwnProperty('wednesday')) {
						if (Storage.servers[server].disabledFeatures.wednesday !== true) {
							let channelID = Storage.servers[server].channels.wednesday;
							sendWednesday(channelID);
						} else {
							msg.channel.send('This server has disabled the Wednesday frog service.');
						}
					} else {
						msg.channel.send('This server doesn\'t have a channel for the Wednesday frog to be sent to.');
					}
				}
			}
		},
	],
	usage : '',
	description : 'It is Wednesday, my dudes.',
	execute(msg) {
		let embed = new Discord.RichEmbed()
			.setTitle('It is Wednesday, my dudes.')
			.setColor(0x00AE86)
			.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
		msg.channel.send({embed});
	}
};

function prepareUser(msg) {
	let author = msg.author.id;
	if (!Storage.users.hasOwnProperty(author)) {
		Storage.users[author] = {};
		saveData();
	}
}

function checkDmOrGroup(msg) {
	return (msg.channel.type === 'dm' || msg.channel.type === 'group');
}
