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
			args : common.argumentValues.OPTIONAL,
			usage: [ '[amount]' ],
			description : [ 'I clean up after myself.' ],
			execute(msg, suffix) {
				let channel = msg.channel;
				let amt = suffix == null ? 10 : suffix;
				channel.bulkDelete(amt, true);
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
						let channel = suffix == null ? msg.channel : client.channels.get(suffix);
						let dump = await createDump(client, 'dm', channel);
						writeDump(dump);
						//console.log(dump.length + ' messages');
					}
				},
				{
					name : 'channel',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[id]' ],
					description : [ 'Dumps all messages in a channel. This channel if ID is not specified.' ]
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

async function getShortenedMessages(client, channel, start, list = []) {
	console.log('Getting messages...');
	let options = {
		limit : 100
	};
	if (start) options.before = start;
	let request = await channel.fetchMessages(options);
	console.log('Request size: ' + request.size);
	if (request.size === 0) return list;

	request.forEach(function(value) {
		list.push(
			{
				author : value.author.username + '#' + value.author.discriminator,
				content : value.content
			}
		);
	});

	return getShortenedMessages(client, channel, request.last().id, list);
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
