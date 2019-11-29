const common = require('../common');
const { Discord, chrono, Config } = common;

const Command = require('../class/Command');

// IMPORT ALL ENUMS
const enums = require('../enum');

let commandEval = new Command('eval', enums.argumentValues.REQUIRED, enums.permissionLevels.BOT_OWNER)
    .addDoc(
        '<javascript>',
        'Runs javascript code. Only available to the owner of the bot.' + '\n' +
        '**ATTENTION: POWERFUL COMMAND, CAN AFFECT FILES BEYOND THE BOT\'S ROOT DIRECTORY**'
    ).setExecute((msg, suffix) => {
        if (msg.author.id === Config.ownerId) {
            let out = eval(suffix);
            if (out) {
                let embed = new Discord.RichEmbed()
                    .setColor(colors.PRESTIGE)
                    .setTitle('Eval output')
                    .setDescription('```' + out + '```');
                msg.channel.send({ embed : embed });
            }
        }
    });

module.exports = commandEval;
