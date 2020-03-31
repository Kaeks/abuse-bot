const Discord = require.main.require('./discordjs_amends');

const classes = require.main.require('./class');
const { Command } = classes;

const enums = require.main.require('./enum');

let commandEval = new Command('eval', enums.argumentValues.REQUIRED, enums.permissionLevels.BOT_OWNER)
    .addDoc(
        '<javascript>',
        'Runs javascript code. Only available to the owner of the bot.' + '\n' +
        '**ATTENTION: POWERFUL COMMAND, CAN AFFECT FILES BEYOND THE BOT\'S ROOT DIRECTORY**'
    ).setExecute((msg, suffix) => {
        let client = msg.client;
        if (msg.author.id === client.config.ownerId) {
            let out = eval(suffix);
            if (out) {
                let embed = new Discord.RichEmbed()
                    .setColor(enums.colors.PRESTIGE)
                    .setTitle('Eval output')
                    .setDescription('```' + out + '```');
                msg.channel.send({ embed : embed });
            }
        }
    });

module.exports = commandEval;
