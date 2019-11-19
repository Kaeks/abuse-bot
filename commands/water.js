const common = require('../common.js');
const {
	Discord,
	Storage, saveData,
} = common;

const argumentValues = require('../enum/ArgumentValueEnum.js');
const colors = require('../enum/EmbedColorEnum.js');

const WaterTimer = require('../class/WaterTimer.js');

// Default water interval (in minutes) to be set when people join the water club
const DEFAULT_WATER_INTERVAL = 60;

module.exports = {
	name : 'water',
	args : argumentValues.NULL,
	sub : [
		{
			name : 'status',
			args : argumentValues.NONE,
			usage : '',
			description : 'Display your current water status.',
			execute(msg) {
				let user = msg.author;
				if (!user.isWaterMember()) {
					sendNotInWaterClub(msg);
					return false;
				}
				let milliseconds = common.waterTimers.get(user.id).getStatus();
				let seconds = Math.floor(milliseconds / 1000);
				let minutes = Math.floor(seconds / 60);
				let newSeconds = seconds - minutes * 60;
				let string = minutes + ' minutes, ' + newSeconds + ' seconds';
				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Next reminder!')
					.setDescription('Your next reminder will be issued in ' + string + '.');
				msg.channel.send({ embed: embed });
			}
		},
		{
			name : 'join',
			args : argumentValues.NONE,
			usage : '',
			description : 'Join the water club.',
			execute(msg) {
				let user = msg.author;
				let storageUser = Storage.users[user.id];
				storageUser = storageUser || {};
				storageUser.water = storageUser.water || {};
				let embed = new Discord.RichEmbed();
				if (user.isWaterMember()) {
					embed.setColor(colors.RED)
						.setTitle('Already a HydroHomie!')
						.setDescription('You are already a member of the water club!');
					msg.channel.send({ embed: embed });
					return false;
				}
				storageUser.water.enabled = true;
				storageUser.water.interval = storageUser.water.interval || DEFAULT_WATER_INTERVAL;
				saveData();
				embed.setColor(colors.GREEN)
					.setTitle('Welcome!')
					.setDescription(
						'You are now a HydroHomie, ' + user + '!' +
						'\nYou will be notified every ' + storageUser.water.interval + ' minutes (default value).'
					);
				msg.channel.send({ embed: embed });
				let waterTimer = new WaterTimer(user, storageUser.water.interval);
				common.addWaterTimer(waterTimer);
			}
		},
		{
			name : 'leave',
			args : argumentValues.NONE,
			usage : '',
			description : 'Leave the water club.',
			execute(msg) {
				let user = msg.author;
				if (!user.isWaterMember()) {
					sendNotInWaterClub(msg);
					return false;
				}
				Storage.users[user.id].water.enabled = false;

				common.waterTimers.get(user.id).stop();

				common.saveWaterTimers();

				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('No longer a HydroHomie')
					.setDescription('You have left the water club. Sad to see you go! :(');
				msg.channel.send({ embed: embed });
			}
		},
		{
			name : 'interval',
			args : argumentValues.NONE,
			sub : [
				{
					name : 'set',
					args : argumentValues.REQUIRED,
					usage : '<interval>',
					description : 'Set a new interval (in minutes)',
					execute(msg, suffix) {
						let user = msg.author;
						if (!user.isWaterMember()) {
							sendNotInWaterClub(msg);
							return false;
						}
						let newIntervalString = suffix;
						if (!isNaN(newIntervalString)) {
							if (parseInt(newIntervalString, 10) > 0 ) {
								let newInterval = parseInt(newIntervalString, 10);

								let waterTimer = common.waterTimers.get(user.id);

								waterTimer.updateInterval(newInterval);

								let embed = new Discord.RichEmbed()
									.setColor(colors.GREEN)
									.setTitle('Water interval updated!')
									.setDescription('Water interval has been set to ' + newInterval + ' minutes.');
								msg.channel.send({ embed: embed });
							} else {
								let embed = new Discord.RichEmbed()
									.setColor(colors.RED)
									.setTitle('0 or below!')
									.setDescription('<interval> must be above 0.');
								msg.channel.send({ embed: embed })
									.then(message => message.delete(5000));
							}
						} else {
							let embed = new Discord.RichEmbed()
								.setColor(colors.RED)
								.setTitle('Not a number!')
								.setDescription('<interval> must be an integer.');
							msg.channel.send({ embed: embed })
								.then(message => message.delete(5000));
						}
					}
				}
			],
			usage : '',
			description : 'Display your current interval',
			execute(msg) {
				let user = msg.author;
				if (!user.isWaterMember()) {
					sendNotInWaterClub(msg);
					return false;
				}
				let userInterval = Storage.users[user.id].water.interval;
				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle('Water interval.')
					.setDescription('Your interval is set to ' + userInterval + ' minutes.');
				msg.channel.send({ embed: embed });
			}
		},
		{
			name : 'ignorednd',
			args : argumentValues.NONE,
			sub : [
				{
					name : 'set',
					args : argumentValues.REQUIRED,
					usage : [ '<true|false>' ],
					description : [ 'Set whether or not I should ignore your DnD status and send you water reminders regardless.' ],
					execute(msg, suffix) {
						let user = msg.author;
						if (!user.isWaterMember()) {
							sendNotInWaterClub(msg);
							return false;
						}
						let boolValue = common.getBooleanValue(suffix);
						if (!common.testBooleanValue(msg, boolValue)) return false;
						Storage.users[user.id].water.ignoreDnd = boolValue;
						saveData();
						let embed = new Discord.RichEmbed()
							.setColor(colors.GREEN)
							.setTitle('Now ' + (boolValue ? 'ignoring' : 'respecting') + ' DnD!')
							.setDescription('I am going to ' + (boolValue ? 'ignore' : 'respect') + ' your DnD status from now on.');
						msg.channel.send({ embed: embed });
					}
				}
			],
			usage : [ '' ],
			description : [ 'View whether I ignore your DnD status.' ],
			execute(msg) {
				let user = msg.author;
				if (!user.isWaterMember()) {
					sendNotInWaterClub(msg);
					return false;
				}
				let ignoring = Storage.users[user.id].water.ignoreDnd;
				let embed = new Discord.RichEmbed()
					.setColor(colors.GREEN)
					.setTitle((ignoring ? 'Ignoring' : 'Respecting') + ' DnD!')
					.setDescription('I am currently ' + (ignoring ? 'ignoring' : 'respecting') + ' your DnD status.');
				msg.channel.send({ embed: embed });
			}
		}
	]
};

function sendNotInWaterClub(msg) {
	if (!msg.author.isWaterMember()) {
		let embed = new Discord.RichEmbed()
			.setColor(colors.RED)
			.setTitle('Not a HydroHomie!')
			.setDescription('That command is only available for members of the water club.');
		msg.channel.send({ embed: embed })
			.then(message => message.delete(5000));
	}
}