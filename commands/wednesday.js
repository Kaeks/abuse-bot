const common = require('../common');
const {
	Discord,
	Storage, saveData,
	sendWednesday
} = common;

const Command = require('../class/Command.js');
const SubCommand = require('../class/SubCommand.js');

const argumentValues = require('../enum/ArgumentValueEnum');
const permissionLevels = require('../enum/PermissionLevelEnum');
const serverFeatures = require('../enum/ServerFeatureEnum');
const colors = require('../enum/EmbedColorEnum');

let commandWednesdayEnable = new SubCommand('enable', argumentValues.NONE)
	.addDoc('', 'Enable wednesday posting.')
	.setExecute(msg => {
		if (checkDmOrGroup(msg)) return false;
		let server = msg.guild;
		server.enableFeature(serverFeatures.WEDNESDAY);
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Wednesday posting enabled!')
			.setDescription('The wednesdaily frog has been enabled. :frog:');
		msg.channel.send({ embed: embed });
	});

let commandWednesdayDisable = new SubCommand('disable', argumentValues.NONE)
	.addDoc('', 'Disable wednesday posting.')
	.setExecute((msg) => {
		if (checkDmOrGroup(msg)) return false;
		let server = msg.guild;
		server.disableFeature(serverFeatures.WEDNESDAY);
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Wednesday posting disabled!')
			.setDescription('The wednesdaily frog has been disabled. <:tairaOOF:455716045987250186>');
		msg.channel.send({ embed: embed });
	});

let commandWednesdayChannelSet = new SubCommand('set', argumentValues.OPTIONAL, permissionLevels.SERVER_SUPERUSER)
	.addDoc('[textChannel]', 'Set channel for Wednesdays.')
	.setExecute((msg, suffix) => {
		if (checkDmOrGroup(msg)) return false;
		let server = msg.guild;
		let channel;
		if (suffix == null) {
			channel = msg.channel;
		} else {
			channel = msg.mentions.channels.first();
		}
		Storage.servers[server.id].channels = Storage.servers[server.id].channels || {};
		Storage.servers[server.id].channels.wednesday = channel.id;
		saveData();
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Wednesday channel set!')
			.setDescription('The channel for Wednesdays has been set to ' + channel);
		msg.channel.send({ embed: embed });
	});

let commandWednesdayChannel = new SubCommand('channel', argumentValues.NONE)
	.addDoc('', 'View channel for Wednesdays.')
	.addSub(commandWednesdayChannelSet)
	.setExecute(msg => {
		if (checkDmOrGroup(msg)) return false;
		let server = msg.guild;
		let channelEntry = Storage.servers[server.id].channels.wednesday;
		let channel = msg.client.channels.get(channelEntry);
		let embed = new Discord.RichEmbed()
			.setColor(colors.GREEN)
			.setTitle('Current wednesday channel')
			.setDescription('The channel for Wednesdays currently is ' + channel);
		msg.channel.send({ embed: embed });
	});

let commandWednesdaySubscribe = new SubCommand('subscribe', argumentValues.NONE)
	.addDoc('', 'Subscribe to the private Wednesday service.')
	.setExecute(msg => {
		let user = msg.author;
		if (isSubscribed(user)) {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Already subscribed!')
				.setDescription('You are already subscribed to the private Wednesday service ' + user + '.');
			msg.channel.send({embed : embed});
		} else {
			Storage.users[user.id].wednesday = true;
			saveData();
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Subscribed!')
				.setDescription('You are now subscribed to the private Wednesday service, ' + user + '!');
			msg.channel.send({embed : embed});
		}
	});

let commandWednesdayUnsubscribe = new SubCommand('unsubscribe', argumentValues.NONE)
	.addDoc('', 'Unsubscribe from the private Wednesday service.')
	.setExecute(msg => {
		let user = msg.author;
		if (isSubscribed(user)) {
			Storage.users[user.id].wednesday = false;
			saveData();
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Unsubscribed!')
				.setDescription('You are no longer subscribed to the private Wednesday service ' + user + '!');
			msg.channel.send({ embed: embed });
		} else {
			let embed = new Discord.RichEmbed()
				.setColor(colors.GREEN)
				.setTitle('Not subscribed!')
				.setDescription('You are not subscribed to the private Wednesday service ' + user + '!');
			msg.channel.send({ embed: embed });
		}
	});

let commandWednesdayTest = new SubCommand('now', argumentValues.NONE, permissionLevels.BOT_SUPERUSER)
	.addDoc('', 'It is Wednesday, my dudes.')
	.setExecute(msg => {
		sendWednesday(msg.channel);
	});

let commandWednesdayNow = new SubCommand('test', argumentValues.NONE, permissionLevels.BOT_SUPERUSER)
	.addDoc('', 'Simulate a Wednesday.')
	.setExecute(async msg => {
		let user = msg.author;
		if (msg.channel.type === 'dm' || msg.channel.type === 'group') {
			if (isSubscribed(user)) {
				sendWednesday(await user.getDmChannel());
			} else {
				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Not subscribed!')
					.setDescription('You need to subscribe to the Wednesday frog service first.');
				msg.channel.send({ embed: embed });
			}
		}
		if (msg.channel.type === 'text') {
			let server = msg.guild;
			if (Storage.servers[server.id].channels.hasOwnProperty('wednesday')) {
				if (Storage.servers[server.id].disabledFeatures.wednesday !== true) {
					let channelEntry = Storage.servers[server.id].channels.wednesday;
					let channel = msg.client.channels.get(channelEntry);
					sendWednesday(channel);
				} else {
					let embed = new Discord.RichEmbed()
						.setColor(colors.GREEN)
						.setTitle('Not enabled!')
						.setDescription('This server has disabled the Wednesday frog service.');
					msg.channel.send({ embed: embed });
				}
			} else {
				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('No channel set!')
					.setDescription('This server doesn\'t have a channel for the Wednesday frog to be sent to.');
				msg.channel.send({ embed: embed });
			}
		}
	});

let commandWednesday = new Command('wednesday', argumentValues.NULL)
	.addSub(commandWednesdayEnable)
	.addSub(commandWednesdayDisable)
	.addSub(commandWednesdaySubscribe)
	.addSub(commandWednesdayUnsubscribe)
	.addSub(commandWednesdayChannel)
	.addSub(commandWednesdayTest)
	.addSub(commandWednesdayNow);

module.exports = commandWednesday;

/**
 * Returns whether or not a user is subscribed to the wednesday service
 * Will automatically fill the required data if it were to be missing
 * @param user
 * @returns {boolean}
 */
function isSubscribed(user) {
	let userEntry = Storage.users[user.id];
	userEntry = userEntry || {};
	userEntry.wednesday = userEntry.wednesday || false;
	return userEntry.wednesday === true;
}

/**
 * Check whether or not the message was sent in a (group) DM channel
 * Will send an error message to the channel if that is the case
 * @param msg
 * @returns {boolean}
 */
function checkDmOrGroup(msg) {
	let statement = (msg.channel.type === 'dm' || msg.channel.type === 'group');
	if (statement) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Not available!')
			.setDescription('That command is not available in (group) DMs.');
		msg.channel.send({ embed: embed })
			.then(message => message.delete(5000));
	}
	return statement;
}
