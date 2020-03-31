//// UTIL FILE

// IMPORTS
const Discord = require.main.require('./discordjs_amends');

const enums = require.main.require('./enum');
const { colors, timeSpans, weekDays, months } = enums;

/**
 * Returns the boolean value of a <true|false> String
 * @param {String} suffix
 * @returns {boolean}
 */
function getBooleanValue(suffix) {
    let newVal;
    if (suffix === 'true') {
        newVal = true;
    } else if (suffix === 'false') {
        newVal = false;
    }
    return newVal
}

/**
 * Returns a number with its ordinal (1st, 2nd, 3rd, 4th, ...)
 * @param {Number} n
 * @returns {String}
 */
function getNumberWithOrdinal(n) {
    let s = ["th","st","nd","rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Turns a date into a string with regard for how long the difference between now and the date is
 * @param {Date} date
 * @returns {String}
 */
function parseDate(date) {
    let now = new Date();
    let diff = date - now;
    let absDiff = Math.abs(diff);

    let year = date.getFullYear(),
        month = date.getMonth(),
        day = date.getDate(),
        dayOfWeek = date.getDay(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        monthString = months[month].short,
        dowString = weekDays[dayOfWeek].name;

    // Less than a day
    if (absDiff <= timeSpans.DAY) {
        let diffHours = Math.floor(absDiff / timeSpans.HOUR);
        let diffHoursString = diffHours + ' hour' + (diffHours !== 1 ? 's' : '');
        let diffMinutes = Math.floor(absDiff / timeSpans.MINUTE - 60 * diffHours);
        let diffMinutesString = diffMinutes + ' minute' + (diffMinutes !== 1 ? 's' : '');
        let diffSecs = Math.floor(absDiff / timeSpans.SECOND - 60 * diffMinutes);
        let diffSecsString = diffSecs + ' second' + (diffSecs !== 1 ? 's' : '');
        return (diff > 0 ? 'In ' : '')
            + (absDiff > timeSpans.HOUR ? diffHoursString + ' ' : '')
            + (absDiff > timeSpans.MINUTE ? diffMinutesString + ' ' : '')
            + (absDiff <= timeSpans.MINUTE ? diffSecsString : '')
            + (diff < 0 ? ' ago' : '');
    }

    // Not this year
    if (now.getFullYear() !== date.getFullYear()) {
        return `${dowString}, ${monthString}. ${getNumberWithOrdinal(day)} ${year} ${hours.pad(2)}:${minutes.pad(2)}`;
    }

    // Today
    if (now.getDate() === date.getDate() && now.getMonth() === date.getMonth()) {
        return `${hours.pad(2)}:${minutes.pad(2)}`;
    }

    // This year but not today
    return `${dowString}, ${monthString}. ${getNumberWithOrdinal(day)} ${hours.pad(2)}:${minutes.pad(2)}`;
}

/**
 * Tests the value of a should-be boolean input. Sends an error message to the message's channel if the value is not a boolean
 * @param msg
 * @param {boolean} value
 * @returns {boolean}
 */
function testBooleanValue(msg, value) {
    if (value === undefined) {
        let embed = new Discord.RichEmbed()
            .setColor(colors.RED)
            .setTitle('Invalid value!')
            .setDescription('Can only be set to `true` or `false`.');
        msg.channel.send({ embed: embed })
            .then(message => message.delete(5000));
        return false;
    }
    return true;
}

/**
 * Sends an image of the wednesday frog to the specified channel
 * @param channel
 */
function sendWednesday(channel) {
    let embed = new Discord.RichEmbed()
        .setTitle('It is Wednesday, my dudes.')
        .setColor(colors.GREEN)
        .attachFiles(['./assets/images/wednesday.jpg'])
        .setImage('attachment://wednesday.jpg');
    channel.send({ embed: embed });
}

/**
 * Returns a string of the combined commands and sub-commands inside a commandChain, separated by ' '
 * @param {Array} commandChain
 * @returns {String}
 */
function combineCommandChain(commandChain) {
    let commandString = '';
    for (let i = 0; i < commandChain.length; i++) {
        commandString += commandChain[i].name;
        if (i < commandChain.length - 1) commandString += ' ';
    }
    return commandString;
}

function generateDateFileName(date) {
    let year = date.getFullYear(),
        month = date.getMonth() + 1,    // January is 0
        day = date.getDate(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds();
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

module.exports = {
    getBooleanValue, getNumberWithOrdinal,
    parseDate,
    testBooleanValue, sendWednesday, generateDateFileName,
    combineCommandChain
};
