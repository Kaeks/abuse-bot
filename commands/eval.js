const common = require('../common.js');
const { Discord, Config } = common;

module.exports = {
    name : 'eval',
    args : common.argumentValues.REQUIRED,
    usage : [ '' ],
    description : [ 'EVAL' ],
    execute(msg, suffix) {
        if (msg.author.id === Config.ownerId) {
            let out = eval(suffix);
            if (out) msg.channel.send(out);
        }
    }
};
