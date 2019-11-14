const common = require('../common.js');
const { Discord, Config } = common;

module.exports = {
    name : 'eval',
    args : common.argumentValues.REQUIRED,
    usage : [ '<javascript>' ],
    description : [
        'Runs javascript code. Only available to the owner of the bot.' + '\n' +
        '**ATTENTION: POWERFUL COMMAND, CAN AFFECT FILES BEYOND THE BOT\'S ROOT DIRECTORY**'
    ],
    execute(msg, suffix) {
        if (msg.author.id === Config.ownerId) {
            let out = eval(suffix);
            if (out) {
                let embed = new Discord.RichEmbed()
                    .setColor(common.colors.PRESTIGE)
                    .setTitle('Eval output')
                    .setDescription('```' + out + '```');
                msg.channel.send({ embed : embed });
            }
        }
    }
};
