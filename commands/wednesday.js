module.exports = {
	name : 'wednesday',
	usage : [
		'',
		'enable/disable',
		'channel',
		'channel set [textChannel]',
		'subscribe/unsubscribe',
		'test'
	],
	description : [
		'It is Wednesday, my dudes.',
		'Enable/disable Wednesday posting.',
		'View channel for Wednesdays.',
		'Set channel for Wednesdays.',
		'Subscribe to/unsubscribe from the private Wednesday service.',
		'Simulate a Wednesday.'
	],
	process : function(_, msg, suffix) {
		let args = suffix.split(' ');
		if (args[0] === '') {
			let embed = new Discord.RichEmbed()
				.setTitle('It is Wednesday, my dudes.')
				.setColor(0x00AE86)
				.setImage('https://i.kym-cdn.com/photos/images/newsfeed/001/091/264/665.jpg');
			msg.channel.send({embed});
			return;
		}
		let server;
		if (args[0] === 'enable' || args[0] === 'disable' || args[0] === 'channel') {
			if (msg.channel.type === 'dm' || msg.channel.type === 'group') {
				msg.channel.send('Cannot be used in (group) DMs.').then((message => message.delete(5000)));
				return;
			}
		}
		let author = msg.author.id;
		if (args[0] === 'channel') {
			server = msg.guild.id;
			if (args[1] === 'set') {
				let channel;
				if (args[2]) {
					channel = msg.mentions.channels.first();
				} else {
					channel = msg.channel;
				}
				Storage.servers[server].channels = Storage.servers[server].channels || {};
				Storage.servers[server].channels.wednesday = channel.id;
				msg.channel.send('Channel for Wednesdays has been set to ' + channel);
				saveVars();
			} else {
				let channelID = Storage.servers[server].channels.wednesday;
				let channel = bot.channels.get(channelID);
				msg.channel.send('Channel for Wednesdays is ' + channel);
			}
		}
		if (args[0] === 'enable') {
			server = msg.guild.id;
			Storage.servers[server].disabledFeatures.wednesday = false;
			msg.channel.send('Wednesdaily frog has been enabled. :frog:');
			saveVars();
		}
		if (args[0] === 'disable') {
			server = msg.guild.id;
			Storage.servers[server].disabledFeatures.wednesday = true;
			msg.channel.send('Wednesdaily frog has been disabled. <:tairaOOF:455716045987250186>');
			saveVars();
		}
		if (args[0] === 'subscribe' || args[0] === 'unsubscribe') {
			if (!Storage.users.hasOwnProperty(author)) {
				Storage.users[author] = {};
				saveVars();
			}
		}
		if (args[0] === 'subscribe') {
			if (Storage.users[author].wednesday === true) {
				msg.channel.send('You are already subscribed to the private Wednesday service.');
			} else {
				Storage.users[author].wednesday = true;
				msg.channel.send('You are now subscribed to the private Wednesday service.');
				saveVars();
			}
		}
		if (args[0] === 'unsubscribe') {
			if (Storage.users[author].wednesday === true) {
				Storage.users[author].wednesday = false;
				msg.channel.send('You are no longer subscribed to the private Wednesday service.');
				saveVars();
			} else {
				msg.channel.send('You are not subscribed to the private Wednesday service.');
			}
		}
		if (args[0] === 'test') {
			if (msg.channel.type === 'dm' || msg.channel.type === 'group') {
				if (Storage.users[author].wednesday === true) {
					sendWednesday(bot.users.get(author).dmChannel.id);
				} else {
					msg.channel.send('You need to subscribe to the Wednesday frog service first.');
				}
			}
			if (msg.channel.type === 'text') {
				server = msg.guild.id;
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
	}
};