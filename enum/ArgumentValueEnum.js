/**
 * VALUE    | ''  | 'foo'
 * ---------+-----+------
 * NULL     | ❌  |  ❌
 * NONE     | ✔  |  ❌
 * OPTIONAL | ✔  |  ✔
 * REQUIRED | ❌  |  ✔
 *
 *	⚠ THIS DOES NOT INCLUDE SUB-COMMANDS ⚠
 *	* A command with only sub-commands but no standalone function is NONE
 *	* A command with sub-commands and a standalone function can be OPTIONAL or REQUIRED,
 *	  depending on whether the standalone function CAN or MUST receive an argument.
 *
 * @type {{OPTIONAL: number, NULL: number, REQUIRED: number, NONE: number}}
 */
module.exports = {
	NULL : -1,
	NONE : 0,
	OPTIONAL : 1,
	REQUIRED : 2
};
