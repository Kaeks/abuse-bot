module.exports = (client, guild) => {
	client.logger.log('Joined server \'' + guild.name + '\'.');
	client.setUpServer(guild);
}
