const Discord = require.main.require('./discordjs_amends')
const util = require.main.require('./util');

const Command = require.main.require('./class/Command');
const SubCommand = require.main.require('./class/SubCommand');
const EditedMessageListHandler = require.main.require('./class/handlers/EditedMessageListHandler');

const enums = require.main.require('./enum');
const { argumentValues, permissionLevels, dumpTypes } = enums;

let commandAdminClean = new SubCommand('clean', argumentValues.NONE, permissionLevels.SERVER_SUPERUSER)
	.addDoc('', 'I clean up after myself.')
	.setExecute(async msg => {
		let channel = msg.channel;
		let client = msg.client;
		let messagesByBot = await client.getMessages(channel, (el) => {
			return el.author.id === client.user.id;
		});
		console.info('Deleting ' + messagesByBot.size + ' of my messages.');
		messagesByBot.forEach(function(value) {
			value.delete().catch(console.error);
		});
});

let commandAdminDumpDm = new SubCommand('dm', argumentValues.OPTIONAL, permissionLevels.BOT_SUPERUSER)
	.addDoc('[userId]', 'Dumps all direct messages with a user. This user if ID is not specified.')
	.setExecute(async (msg, suffix) => {
		msg.client.dumpHandler.createDump(msg, suffix, dumpTypes.DM);
	});

let commandAdminDumpChannel = new SubCommand('channel', argumentValues.OPTIONAL)
	.addDoc('[id]', 'Dumps all messages in a channel. This channel if ID is not specified.')
	.setExecute(async (msg, suffix) => {
		let client = msg.client;
		let channel = suffix == null ? msg.channel : client.channels.get(suffix);
		let type = channel.type === 'dm' ? dumpTypes.DM : dumpTypes.CHANNEL;
		client.dumpHandler.createDump(msg, suffix, type);
	});

let commandAdminDumpServer = new SubCommand('server', argumentValues.OPTIONAL)
	.addDoc('[id]', 'Dumps all messages in a server. This server if ID is not specified.')
	.setExecute(async (msg, suffix) => {
		msg.client.dumpHandler.createDump(msg, suffix, dumpTypes.SERVER);
	});

let commandAdminDumpAll = new SubCommand('all', argumentValues.NONE, permissionLevels.BOT_OWNER)
	.addDoc('', 'Dumps all messages.')
	.setExecute(async (msg, suffix) => {
		msg.client.dumpHandler.createDump(msg, suffix, dumpTypes.ALL)
	});

let commandAdminDump = new SubCommand('dump', argumentValues.NULL)
	.addSub(commandAdminDumpDm)
	.addSub(commandAdminDumpChannel)
	.addSub(commandAdminDumpServer)
	.addSub(commandAdminDumpAll);

let commandAdminEditedView = new SubCommand('view', argumentValues.OPTIONAL)
	.addDoc('[amount]', 'View saved edited messages.')
	.setExecute((msg, suffix) => {
		let client = msg.client;
		let index = suffix ? suffix - 1 : 0;
		let editedHandler = new EditedMessageListHandler(client, msg.channel, client.editedMessages, index);
		editedHandler.build();
	});

let commandAdminEdited = new SubCommand('edited', argumentValues.NULL)
	.addSub(commandAdminEditedView);

let commandAdmin = new Command('admin', argumentValues.NULL, permissionLevels.SERVER_SUPERUSER)
	.addSub(commandAdminClean)
	.addSub(commandAdminDump)
	.addSub(commandAdminEdited);

module.exports = commandAdmin;
