# wiktor-bot

## Setup

Requires [node.js](https://nodejs.org/) and [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)

Written using [discord.js](https://discord.js.org). I will try to keep this bot up to date with the latest updates of discord.js.

0. Create a bot application on [Discordapp's Developer Portal](https://discordapp.com/developers/applications/)

1. Install [discord.js](https://discord.js.org) and its dependencies inside your bot's root directory using `npm install discord.js`.

2. Follow the installation for [better-sqlite3](https://www.npmjs.com/package/better-sqlite3). Usually, `npm install --save better-sqlite3` should work just fine.

3. Create `config.json` in the bot's root directory and fill it with the following data, replacing the data in angle brackets with your configuration.

```
{
    "prefix": <BOT COMMAND PREFIX>,
    "token": <TOKEN>,
    "debug": <true|false>
}
```

4. Run bot.js through `node bot.js`.

## Privacy Disclaimer

This bot stores data that is available to it through discord.js and, by extension, the Discord API and uses it to perform its functions. This data includes but is not limited to: Usernames (including # handle), nicknames, avatars, chat messages sent in channels to which the bot has access to and the bot's own DMs, as well as any attached files in these messages.

The function to opt-out of the storage of user-specific data is being worked on, but will disable access to the bot's other functions due to a lack of data to work with.

Any sensitive data is not protected from breaches, as it is currently being stored inside unencrypted JSON files. Use at your own risk.

If you are a private server owner that happens to stumble upon my bot and decide to use it on your own server, either through hosting it yourself or relying on my personal host, I would like you to inform your users of this data storage and its insecurity.
