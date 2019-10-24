module.exports = {
	name: 'water',
	sub: [
		{name: 'status'},
		{name: 'join'},
		{name: 'leave'},
		{
			name: 'interval',
			args: true,
			sub: [
				{
					name: 'set',
					args: true
				}
			]
		}
	],
	usage: [
		'status',
		'join',
		'leave',
		'interval [set <minutes>]'
	],
	description: [
		'Display your current water status.',
		'Join the water club.',
		'Leave the water club.',
		'Display your current interval or set a new interval.'
	],
		process: function(_, msg, suffix) {
		if (suffix === '') {
			msg.channel.send(getHelpEmbed('water'));
		}
		let args = suffix.split(' ');
		let user = msg.author;
		if (args[0] === 'status' || args[0] === 'interval') {
			if (
				Storage.users[user.id] === undefined ||
				Storage.users[user.id].water === undefined ||
				Storage.users[user.id].water.enabled !== true) {
				msg.channel.send('Wait, that\'s illegal. You are not a member of the water club.');
				return false;
			}
		}
		switch(args[0]) {
			case 'status':
				let seconds = Math.floor(getWaterTimerStatus(user.id) / 1000);
				let minutes = Math.floor(seconds / 60);
				let newSeconds = seconds - minutes * 60;
				let string = minutes + ' minutes, ' + newSeconds + ' seconds';
				msg.channel.send('Your next reminder will be issued in ' + string + '.');
				break;

			case 'join':
				const WATER_INTERVAL = 60;
				Storage.users[user.id] = Storage.users[user.id] || {};
				Storage.users[user.id].water = Storage.users[user.id].water || {};
				debugLog(Storage.users);
				if (Storage.users[user.id].water.enabled === true) {
					msg.channel.send('You are already a member of the water club!');
					break;
				}
				debugLog(Storage.users);
				Storage.users[user.id].water.enabled = true;
				Storage.users[user.id].water.interval = WATER_INTERVAL;
				debugLog(Storage.users);
				fs.writeFileSync('./vars.json', JSON.stringify(Storage, null, 2));
				debugLog(Storage.users);
				msg.channel.send('Welcome to the water club, ' + msg.author + '!\nYou will be notified every ' + WATER_INTERVAL + ' minutes (default value).');
				addWaterTimer(user.id, Storage.users[user.id].water.interval);
				break;

			case 'leave':
				if (
					Storage.users[user.id] === undefined ||
					Storage.users[user.id].water === undefined ||
					Storage.users[user.id].water.enabled !== true
				) {
					msg.channel.send('Can\'t leave a club you are not a member of :^)');
					break;
				}
				Storage.users[user.id].water.enabled = false;
				saveVars();
				msg.channel.send('You have left the water club. Sad to see you go! :(');
				stopWaterTimer(user.id);
				break;

			case 'interval':
				if (args[1] == null) {
					let userInterval = Storage.users[user.id].water.interval;
					msg.channel.send('Your interval is set to ' + userInterval + ' minutes.');
					break;
				}
				if (args[1] === 'set') {
					if (args[2] != null) {
						let newIntervalString = args[2];
						if (!isNaN(newIntervalString)) {
							if (parseInt(newIntervalString, 10) > 0 ) {
								let newInterval = parseInt(newIntervalString, 10);
								Storage.users[user.id].water.interval = newInterval;
								saveVars();
								msg.channel.send('Water interval has been set to ' + newInterval + ' minutes.');
								debugLog(waterTimers);
								debugLog(runningTimers);
								updateWaterTimer(user.id);
								debugLog(waterTimers);
								debugLog(runningTimers);
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
				break;
		}
	}
};