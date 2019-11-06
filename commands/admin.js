const common = require('../common.js');
const { Config } = common;
const Discord = require('discord.js');
const DUMP_DIRECTORY = 'dumps/';
const DUMP_TYPE = {
	ALL : 'all',
	DM : 'dm',
	SERVER : 'server',
	CHANNEL : 'channel'
};

module.exports = {
	name : 'admin',
	args : common.argumentValues.REQUIRED,
	sub : [
		{
			name : 'clean',
			args : common.argumentValues.NONE,
			usage: [ '' ],
			description : [ 'I clean up after myself.' ],
			async execute(msg) {
				let channel = msg.channel;
				let client = msg.client;
				let messagesByBot = await getMessages(msg.client, channel, function(element) {
					return element.author.id === client.user.id;
				});
				console.info('Deleting ' + messagesByBot.size + ' of my messages.');
				messagesByBot.forEach(function(value) {
					value.delete().catch(console.error);
				});
			}
		},
		{
			name : 'dump',
			args : common.argumentValues.REQUIRED,
			sub : [
				{
					name : 'dm',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[userId]' ],
					description : [ 'Dumps all direct messages with a user. This user if ID is not specified.' ],
					async execute(msg, suffix) {
						let client = msg.client;
						let user = suffix == null ? msg.author : client.users.get(suffix);
						let channel = user.dmChannel;
						let dump = await createDump(client, DUMP_TYPE.DM, channel);
						writeDump(dump);
						//console.log(dump.length + ' messages');
					}
				},
				{
					name : 'channel',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[id]' ],
					description : [ 'Dumps all messages in a channel. This channel if ID is not specified.' ],
					async execute(msg, suffix) {
						let client = msg.client;
						let channel = suffix == null ? msg.channel : client.channels.get(suffix);
						let dump = await createDump(client, DUMP_TYPE.CHANNEL, channel);
						writeDump(dump);
					}
				},
				{
					name : 'server',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[id]' ],
					description : [ 'Dumps all messages in a server. This server if ID is not specified.' ]
				},
				{
					name : 'all',
					args : common.argumentValues.NONE,
					usage : [ '' ],
					description : [ 'Dumps all messages.' ]
				}
			]
		}
	],
};

async function createDump(client, type, channel) {
	if (!['dm', 'group', 'text'].includes(channel.type)) throw 'Channel is not a text based channel.';
	let content = await getShortenedMessages(client, channel);
	let item = {
		type : type,
		content: content
	};
	return item;
}

//TODO: add counter for amount of messages, track time taken until finish etc.

async function getMessages(client, channel, filter, start, collection = new Discord.Collection()) {
	console.log('Getting messages...');
	let options = {
		limit : 100
	};
	if (start) options.before = start;
	let request = await channel.fetchMessages(options);
	if (filter) request = request.filter(filter);
	console.log('Request size: ' + request.size);
	let newCollection = collection.concat(request);
	if (request.size === 0) return newCollection;
	return getMessages(client, channel, filter, request.last().id, newCollection);
}

async function getShortenedMessages(client, channel, filter) {
	let request = await getMessages(client, channel, filter)

	let list = [];

	request.forEach(message => {

		let shortened = {
			author : message.author.username + '#' + message.author.discriminator,
			content : message.content,
			attachments : []
		}

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

function generateDumpName(dump) {
	let now = new Date();
	let year = now.getFullYear(),
		month = now.getMonth(),
		day = now.getDay(),
		hours = now.getHours(),
		minutes = now.getMinutes(),
		seconds = now.getSeconds();
	return `dump_${dump.type}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`
}

function writeDump(dump) {
	let name = generateDumpName(dump);
	let path = DUMP_DIRECTORY + name;
	common.info('New dump created at \'' + path + '\'!');
	common.mkDirByPathSync(DUMP_DIRECTORY, {isRelativeToScript: true});
	common.saveFile(path, dump.content);
}
