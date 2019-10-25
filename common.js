const { debug } = require('./data.json');

module.exports = {
	debugLog(msg) {
		if (debug) console.log(msg);
	},

	unparseDate(date) {
		let dateString;
		if (Date.compare(Date.parse(date), (1).day().fromNow()) === 1) {
			if (Date.compare(Date.parse(date), (1).year().fromNow()) === 1) {
				dateString = Date.parse(date).toString('MMM dS, yyyy HH:mm');
			} else {
				dateString = Date.parse(date).toString('MMM dS HH:mm');
			}
		} else {
			dateString = Date.parse(date).toString('HH:mm');
		}
		return dateString;
	}
};