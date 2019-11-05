const common = require('../common.js');
const {
	fs,
	Storage,
	saveData,
	waterTimers, runningTimers
} = common;
const Discord = require('discord.js');

module.exports = {
	name : 'water',
	args : common.argumentValues.REQUIRED,
	sub : [
		{
			name : 'status',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Display your current water status.',
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');

				let seconds = Math.floor(getWaterTimerStatus(user.id) / 1000);
				let minutes = Math.floor(seconds / 60);
				let newSeconds = seconds - minutes * 60;
				let string = minutes + ' minutes, ' + newSeconds + ' seconds';
				msg.channel.send('Your next reminder will be issued in ' + string + '.');
			}
		},
		{
			name : 'join',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Join the water club.',
			execute(msg) {
				let user = msg.author;
				const WATER_INTERVAL = 60;
				Storage.users[user.id] = Storage.users[user.id] || {};
				Storage.users[user.id].water = Storage.users[user.id].water || {};
				common.debug(Storage.users);
				if (Storage.users[user.id].water.enabled === true) {
					msg.channel.send('You are already a member of the water club!');
					return;
				}
				common.debug(Storage.users);
				Storage.users[user.id].water.enabled = true;
				Storage.users[user.id].water.interval = WATER_INTERVAL;
				common.debug(Storage.users);
				fs.writeFileSync('./data.json', JSON.stringify(Storage, null, 2));
				common.debug(Storage.users);
				msg.channel.send('Welcome to the water club, ' + msg.author + '!\nYou will be notified every ' + WATER_INTERVAL + ' minutes (default value).');
				addWaterTimer(user.id, Storage.users[user.id].water.interval);
			}
		},
		{
			name : 'leave',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Leave the water club.',
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) {
					msg.channel.send('Can\'t leave a club you are not a member of :^)');
					return;
				}
				Storage.users[user.id].water.enabled = false;
				saveData();
				msg.channel.send('You have left the water club. Sad to see you go! :(');
				stopWaterTimer(user.id);
			}
		},
		{
			name : 'interval',
			args : common.argumentValues.OPTIONAL,
			sub : [
				{
					name : 'set',
					args : common.argumentValues.REQUIRED,
					usage : '<minutes>',
					description : 'Set a new interval',
					execute(msg, suffix) {
						let user = msg.author;
						if (!checkWaterMember(user)) msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');

						let args = suffix.split(' ');
						if (args[0] != null) {
							let newIntervalString = args[0];
							if (!isNaN(newIntervalString)) {
								if (parseInt(newIntervalString, 10) > 0 ) {
									let newInterval = parseInt(newIntervalString, 10);
									Storage.users[user.id].water.interval = newInterval;
									saveData();
									msg.channel.send('Water interval has been set to ' + newInterval + ' minutes.');
									common.debug(waterTimers);
									common.debug(runningTimers);
									updateWaterTimer(user.id);
									common.debug(waterTimers);
									common.debug(runningTimers);
								} else {
									msg.channel.send('<interval> must be above 0.');
								}
							} else {
								msg.channel.send('<interval> must be an integer.');
							}
						} else {
							msg.channel.send('Usage: `' + Storage.prefix + 'water set <interval in minutes>`');
						}
					}
				}
			],
			usage : '',
			description : 'Display your current interval',
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');

				let userInterval = Storage.users[user.id].water.interval;
				msg.channel.send('Your interval is set to ' + userInterval + ' minutes.');
			}
		}
	]
};

function checkWaterMember(user) {
	return !(
		Storage.users[user.id] === undefined ||
		Storage.users[user.id].water === undefined ||
		Storage.users[user.id].water.enabled !== true
	);
}