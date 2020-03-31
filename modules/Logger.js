module.exports.debug = console.log.bind(this, '\x1b[36m%s\x1b[0m', '[DEBUG]');
module.exports.log = console.log.bind(this, '\x1b[2m%s\x1b[0m', '[LOG]');
module.exports.info = console.log.bind(this, '\x1b[33m%s\x1b[0m', '[INFO]');
module.exports.warn = console.log.bind(this, '\x1b[31m%s\x1b[0m', '[WARN]');