/**
 * Enum for permission levels to be used in command handling
 *
 * Specifying no 'permissionLevel' property for a (sub-)command works like inheritance
 *
 * The base permission level is 'NONE', which means a command without a 'permissionLevel' property will 'inherit' 'NONE'
 * from the base case.
 *
 * Sub-commands cannot have lower permission level values than their parent command. The permission level can be higher, though.
 * 
 * @type {{BOT_OWNER: number, SERVER_OWNER: number, BOT_SUPERUSER: number, SERVER_SUPERUSER: number, NONE: number}}
 */
module.exports = {
	BOT_OWNER : 9001,
	BOT_SUPERUSER : 1000,
	SERVER_OWNER : 100,
	SERVER_SUPERUSER : 10,
	NONE : 0
};
