const common = require('../common.js');
const {
	Config, Storage,
	saveData,
	waterTimers, runningTimers,
	sendWater, addWaterTimer, loadWaterTimers, startWaterTimer, startAllWaterTimers, stopWaterTimer, updateWaterTimer, getWaterTimerStatus
} = common;
const Discord = require('discord.js');

// Default water interval (in minutes) to be set when people join the water club
const DEFAULT_WATER_INTERVAL = 60;

module.exports = {
	name : 'water',
	args : common.argumentValues.NULL,
	sub : [
		{
			name : 'status',
			args : common.argumentValues.NONE,
			usage : '',
			description : 'Display your current water status.',
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) {
					msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
					return false;
				}
				let milliseconds = getWaterTimerStatus(user);
				let seconds = Math.floor(milliseconds / 1000);
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
				let storageUser = Storage.users[user.id];
				storageUser = storageUser || {};
				storageUser.water = storageUser.water || {};
				if (checkWaterMember(user)) {
					msg.channel.send('You are already a member of the water club!');
					return false;
				}
				storageUser.water.enabled = true;
				storageUser.water.interval = storageUser.water.interval || DEFAULT_WATER_INTERVAL;
				saveData();
				msg.channel.send('Welcome to the water club, ' + msg.author + '!\nYou will be notified every ' + DEFAULT_WATER_INTERVAL + ' minutes (default value).');
				addWaterTimer(user);
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
					msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
					return false;
				}
				Storage.users[user.id].water.enabled = false;
				saveData();
				msg.channel.send('You have left the water club. Sad to see you go! :(');
				stopWaterTimer(user);
			}
		},
		{
			name : 'interval',
			args : common.argumentValues.NONE,
			sub : [
				{
					name : 'set',
					args : common.argumentValues.REQUIRED,
					usage : '<interval>',
					description : 'Set a new interval (in minutes)',
					execute(msg, suffix) {
						let user = msg.author;
						if (!checkWaterMember(user)) {
							msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
							return false;
						}
						let newIntervalString = suffix;
						if (!isNaN(newIntervalString)) {
							if (parseInt(newIntervalString, 10) > 0 ) {
								let newInterval = parseInt(newIntervalString, 10);
								Storage.users[user.id].water.interval = newInterval;
								saveData();
								msg.channel.send('Water interval has been set to ' + newInterval + ' minutes.');
								common.debug(waterTimers);
								common.debug(runningTimers);
								updateWaterTimer(user);
								common.debug(waterTimers);
								common.debug(runningTimers);
							} else {
								msg.channel.send('<interval> must be above 0.');
							}
						} else {
							msg.channel.send('<interval> must be an integer.');
						}
					}
				}
			],
			usage : '',
			description : 'Display your current interval',
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) {
					msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
					return false;
				}
				let userInterval = Storage.users[user.id].water.interval;
				msg.channel.send('Your interval is set to ' + userInterval + ' minutes.');
			}
		},
		{
			name : 'ignorednd',
			args : common.argumentValues.NONE,
			sub : [
				{
					name : 'set',
					args : common.argumentValues.REQUIRED,
					usage : [ '<true|false>' ],
					description : [ 'Set whether or not I should ignore your DnD status and send you water reminders regardless.' ],
					execute(msg, suffix) {
						let user = msg.author;
						if (!checkWaterMember(user)) {
							msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
							return false;
						}
						let newVal = common.getBooleanValue(suffix);
						if (newVal === undefined) {
							msg.channel.send('Must be `true` or `false`.').then((message => message.delete(3000)));
							return false;
						}
						Storage.users[user.id].water.ignoreDnD = newVal;
						msg.channel.send('I am going to ' + (newVal ? 'ignore' : 'respect') + ' your DnD status from now on.');
						saveData();
					}
				}
			],
			usage : [ '' ],
			description : [ 'View whether I ignore your DnD status.' ],
			execute(msg) {
				let user = msg.author;
				if (!checkWaterMember(user)) {
					msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
					return false;
				}
				if (Storage.users[user.id].water.ignoreDnD === true) {
					msg.channel.send('I am currently ignoring your DnD status.');
				} else {
					msg.channel.send('I am currently respecting your DnD status.');
				}
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