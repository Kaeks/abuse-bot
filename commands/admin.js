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
	args : common.argumentValues.NULL,
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
			args : common.argumentValues.NULL,
			sub : [
				{
					name : 'dm',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[userId]' ],
					description : [ 'Dumps all direct messages with a user. This user if ID is not specified.' ],
					async execute(msg, suffix) {
						let client = msg.client;
						let user = suffix == null ? msg.author : client.users.get(suffix);
						let channel = await common.getDmChannel(user);
						let dump = await createDump(msg, client, DUMP_TYPE.DM, channel);
						writeDump(dump);
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
						let dump = await createDump(msg, client, DUMP_TYPE.CHANNEL, channel);
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

async function createDump(msg, client, type, channel) {
	if (Object.values(DUMP_TYPE).indexOf(type) === -1) throw `Invalid type ${type}.`;
	if (!['dm', 'group', 'text'].includes(channel.type)) throw 'Channel is not a text based channel.';

	// get channel name
	let str = 'Creating dump for ';
	str +=
		type === DUMP_TYPE.DM ? 'DM channel with ' + channel.recipient.username + '#' + channel.recipient.discriminator + ' (' + channel.recipient.id + ')' :
			type === DUMP_TYPE.CHANNEL ? 'channel \'' + channel.name + '\' (' + channel.id + ')' :
				type === DUMP_TYPE.SERVER ? 'server \'' + channel.guild.name + '\' (' + channel.guild.id + ')' :
					type === DUMP_TYPE.ALL ? 'EVERYTHING' : 'nothing';
	common.info(str);

	let before = new Date();
	let messages = await getShortenedMessages(client, channel);
	let after = new Date();
	let timeDiff = after - before;
	logTimeTaken(timeDiff);
	common.log((messages.length / (timeDiff / 1000)).toFixed(2) + ' messages per second.');

	let content = {
		issued : {
			on : before,
			in : {
				id : msg.channel.id,
				type : msg.channel.type
			},
			by : {
				handle : msg.author.username + '#' + msg.author.discriminator,
				id : msg.author.id
			}
		},
		messages : messages
	};
	return {
		type : type,
		content : content
	};
}

async function getMessages(client, channel, filter, start, collection = new Discord.Collection()) {
	common.debug('Getting messages...');
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
	common.debug(str);

	if (request.size === 0) {
		common.log('Done! Total size: ' + newCollection.size);
		return newCollection;
	}
	return getMessages(client, channel, filter, request.last().id, newCollection);
}

async function getShortenedMessages(client, channel, filter) {
	let request = await getMessages(client, channel, filter);

	let list = [];

	request.forEach(message => {

		let shortened = {
			author : message.author.username + '#' + message.author.discriminator,
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

function logTimeTaken(ms) {
	let seconds = Math.floor(ms / 1000);
	let newMs = ms - seconds * 1000;
	let minutes = Math.floor(seconds / 60);
	let newSeconds = seconds - minutes * 60;
	let hours = Math.floor(minutes / 60);
	let newMinutes = minutes - hours * 60;

	let hourString 	 = hours	  ? hours 	   + ' hour' 		+ (hours 	  > 1 ? 's ' : ' ')	: '';
	let minuteString = newMinutes ? newMinutes + ' minute' 		+ (newMinutes > 1 ? 's ' : ' ')	: '';
	let secondString = newSeconds ? newSeconds + ' second'  	+ (newSeconds > 1 ? 's ' : ' ')	: '';
	let msString 	 = newMs 	  ? newMs 	   + ' millisecond' + (newMs 	  > 1 ? 's'  : '' )	: '';

	common.log(`Time taken: ${hourString}${minuteString}${secondString}${msString}.`);
}
