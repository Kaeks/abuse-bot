const common = require('../common.js');
const { fs, Config } = common;
const Discord = require('discord.js');
const DUMP_DIRECTORY = 'dumps';
const DUMP_TYPE = {
	ALL : 'all',
	SERVER : 'server',
	CHANNEL : 'channel',
	DM :'dm'
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
						await createDump(msg, suffix, DUMP_TYPE.DM);
					}
				},
				{
					name : 'channel',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[id]' ],
					description : [ 'Dumps all messages in a channel. This channel if ID is not specified.' ],
					async execute(msg, suffix) {
						let channel = suffix == null ? msg.channel : client.channels.get(suffix);
						let type = channel.type === 'dm' ? DUMP_TYPE.DM : DUMP_TYPE.CHANNEL;
						await createDump(msg, suffix, type);
					}
				},
				{
					name : 'server',
					args : common.argumentValues.OPTIONAL,
					usage : [ '[id]' ],
					description : [ 'Dumps all messages in a server. This server if ID is not specified.' ],
					async execute(msg, suffix) {
						await createDump(msg, suffix, DUMP_TYPE.SERVER);
					}
				},
				{
					name : 'all',
					args : common.argumentValues.NONE,
					usage : [ '' ],
					description : [ 'Dumps all messages.' ],
					async execute(msg, suffix) {
						await createDump(msg, suffix, DUMP_TYPE.ALL)
					}
				}
			]
		}
	],
};

async function createDump(msg, suffix, type) {
	if (Object.values(DUMP_TYPE).indexOf(type) === -1) throw `Invalid type ${type}.`;
	let client = msg.client;
	if (type === DUMP_TYPE.DM) {
		let user = suffix == null ? msg.author : client.users.get(suffix);
		let channel = await common.getDmChannel(user);
		let dump = await getChannelDump(msg, channel);
		writeDump(dump, 'dm/' + user.id);
	} else if (type === DUMP_TYPE.CHANNEL) {
		let channel = suffix == null ? msg.channel : client.channels.get(suffix);
		let dump = await getChannelDump(msg, channel);
		writeDump(dump, 'channel/' + channel.id);
	} else if (type === DUMP_TYPE.SERVER) {
		let server = suffix == null ? msg.guild : client.guilds.get(suffix);
		let dumps = await getServerDumps(msg, server);
		for (let dump of dumps) {
			writeDump(dump, 'server/' + server.id);
		}
	} else if (type === DUMP_TYPE.ALL) {
		await createFullDump(msg);
	}
}

async function createFullDump(msg) {
	let client = msg.client;
	common.info('Creating full dump of all channels!');
	let before = new Date();
	let dumpDirectory = 'full/' + generateDateFileName(before) + '/';

	let msgAmt = 0;

	// Get all users
	let users = common.getUsers();
	// -> Cache all available DM channels
	for (let userEntry of users) {
		let user = userEntry[1];
		let dmChannel = await common.getDmChannel(user);
		let dump = await getChannelDump(msg, dmChannel);
		writeDump(dump, dumpDirectory + 'dm/' + user.id);
		msgAmt += dump.messages.length;
	}

	// Get all group DMs
	let groupDmChannels = client.channels.filter(channel => {return channel.type === 'group'});
	for (let groupDmChannelEntry of groupDmChannels) {
		let groupDmChannel = groupDmChannelEntry[1];
		let dump = await getChannelDump(msg, groupDmChannel);
		writeDump(dump, dumpDirectory + 'group/' + groupDmChannel.id);
		msgAmt += dump.messages.length;
	}

	let serverChannelAmt = 0;

	// Get all servers
	let servers = client.guilds;
	for (let serverEntry of servers) {
		let server = serverEntry[1];
		let dumps = await getServerDumps(msg, server);
		serverChannelAmt += dumps.length;
		for (let dump of dumps) {
			writeDump(dump, dumpDirectory + 'server/' + server.id);
			msgAmt += dump.messages.length;
		}
	}

	let dmAmt = users.size;
	let groupAmt = groupDmChannels.size;
	let serverAmt = servers.size;

	common.log('Done! Servers: ' + serverAmt + ' with ' + serverChannelAmt + ' channels, Groups: ' + groupAmt + ', DMs: ' + dmAmt);
	common.log('Total channels: ' + (dmAmt + groupAmt + serverChannelAmt));
	common.log('Grand total of messages: ' + msgAmt);

	let after = new Date();
	let timeDiff = after - before;
	logTimeTaken(timeDiff);

	common.log((msgAmt / (timeDiff / 1000)).toFixed(2) + ' messages per second.');
}

async function getServerDumps(msg, server) {
	common.info('Creating dump for server \'' + server + '\' (' + server.id + ')');
	let filtered = server.channels.filter(val => {return val.type === 'text'});
	let before = new Date();
	let msgCounter = 0;
	let dumps = [];
	for (const channelEntry of filtered) {
		let channel = channelEntry[1];
		let dump = await getChannelDump(msg, channel);
		msgCounter += dump.messages.length;
		dumps.push(dump);
	}
	common.log('Done! Channels: ' + filtered.size + ', Total messages: ' + msgCounter);
	let after = new Date();
	let timeDiff = after - before;
	logTimeTaken(timeDiff);
	common.log((msgCounter / (timeDiff / 1000)).toFixed(2) + ' messages per second.');
	return dumps;
}

async function getChannelDump(msg, channel) {
	if (!['dm', 'group', 'text'].includes(channel.type)) throw 'Channel is not a text based channel.';

	let channelInfo = {};
	// get channel name
	let str = 'Creating dump for ';
	if (channel.type === 'dm') {
		str += 'DM channel with ' + channel.recipient.username + '#' + channel.recipient.discriminator + ' (' + channel.recipient.id + ')';
		channelInfo.recipient = {
			handle : channel.recipient.username + '#' + channel.recipient.discriminator,
			id : channel.recipient.id
		}
	} else if (channel.type === 'group') {
		str += 'group channel (' + channel.id + ')';
	} else if (channel.type === 'text') {
		str += 'channel \'' + channel.name + '\' (' + channel.id + ')';
		channelInfo.name = channel.name;
		channelInfo.server = {
			id : channel.guild.id,
			name : channel.guild.name
		}
	}

	common.info(str);

	let before = new Date();
	let messages = await getShortenedMessages(channel);
	let after = new Date();
	let timeDiff = after - before;
	logTimeTaken(timeDiff);
	common.log((messages.length / (timeDiff / 1000)).toFixed(2) + ' messages per second.');

	return {
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
		channel : {
			id : channel.id,
			type : channel.type,
			info : channelInfo
		},
		messages : messages
	};
}

async function getMessages(channel, filter, start, collection = new Discord.Collection()) {
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
	return getMessages(channel, filter, request.last().id, newCollection);
}

async function getShortenedMessages(channel, filter) {
	let request = await getMessages(channel, filter);

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

function generateDateFileName(date) {
	let year = date.getFullYear(),
		month = date.getMonth(),
		day = date.getDay(),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds();
	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

function generateDumpName(dump) {
	let date = dump.issued.on;
	return `dump_${dump.channel.type}${dump.channel.id}_${generateDateFileName(date)}.json`
}

function writeDump(dump, subDir = '') {
	let name = generateDumpName(dump);
	let fullDirPath = DUMP_DIRECTORY + '/' + subDir;
	let path = fullDirPath + '/' + name;
	common.info('New dump created at \'' + path + '\'!');
	fs.mkdirSync(fullDirPath, {recursive: true});
	common.saveFile(path, dump);
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