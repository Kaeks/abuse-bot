//// SETUP
// GLOBAL IMPORTS
const Discord = require('./discordjs_amends');
const client = new Discord.Client();
const fs = require('fs');

client.logger = require('./modules/Logger');
client.commands = new Discord.Collection();

const handlers = require('./class/handlers');
const {
	FileHandler, WednesdayHandler,
	ReminderHandler, CustomFunctionHandler,
	WaterHandler, ReactionListenerHandler,
	DumpHandler, ConfigHandler, DataHandler
} = handlers;

client.fileHandler = new FileHandler(client);

client.configHandler = new ConfigHandler(client, './config.json');
client.configHandler.load();

// CONSTANTS
const STORAGE_DIR = client.config.devMode ? './storage/dev/' : './storage/';

// STORAGE FILE PATHS
client.paths = {
	DATA:			STORAGE_DIR + 'data.json',
	BLOCKED:		STORAGE_DIR + 'blocked_users.json',
	DELETED:		STORAGE_DIR + 'deleted_messages.json',
	EDITED:			STORAGE_DIR + 'edited_messages.json',
	REMINDER:		STORAGE_DIR + 'reminders.json',
	CUSTOM_FUNC:	STORAGE_DIR + 'custom_functions.json'
}

client.dataHandler = new DataHandler(client, client.paths.DATA);

client.blockedUsers = client.fileHandler.load(client.paths.BLOCKED);
client.deletedMessages = client.fileHandler.load(client.paths.DELETED);
client.editedMessages = client.fileHandler.load(client.paths.EDITED);

client.wednesdayHandler = new WednesdayHandler(client);
client.reminderHandler = new ReminderHandler(client, client.paths.REMINDER);
client.customFunctionHandler = new CustomFunctionHandler(client, client.paths.CUSTOM_FUNC);
client.waterHandler = new WaterHandler(client);
client.reactionListenerHandler = new ReactionListenerHandler(client);
client.dumpHandler = new DumpHandler(client);

client.dataHandler.load();

require('./modules/functions')(client);

//// AMENDS
Number.prototype.pad = function(size) {
	let s = String(this);
	while (s.length < (size || 2)) s = '0' + s;
	return s;
};

// Catch UnhandledPromiseRejection
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

const init = async () => {

	// BAD WORDS
	const specialChars = '[ ^°"$%&/()=?{}\\[\\]\\\\`´*+~#\'\\-_.:,;<>|]';
	const badWords = fs.readFileSync('./storage/badwords.txt', 'utf-8').split(/\r\n?|\n/).join('|');

	client.badWordsRegExp = new RegExp('(?<=^|' + specialChars + ')(' + badWords + ')(?=$|' + specialChars + ')');

	const commandFiles = fs.readdirSync('./commands').filter(file => file.match(/.js$/));
	for (const file of commandFiles) {
		const command = require('./commands' + '/' + file);
		client.commands.set(command.name, command);
	}
	
	client.login(client.config.devMode ? client.config.devToken : client.config.token).catch(console.error);

	const evtFiles = fs.readdirSync('./events');
  	client.logger.log(`Loading a total of ${evtFiles.length} events.`);
  	evtFiles.forEach(file => {
    	const eventName = file.split(".")[0];
    	client.logger.log(`Loading Event: ${eventName}`);
    	const event = require(`./events/${file}`);
    	client.on(eventName, event.bind(null, client));
  	});
}

//// ENTRY POINT
init();
