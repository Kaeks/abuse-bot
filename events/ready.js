module.exports = async (client) => {
    // Initial "Hello world!"
    console.log('*hacker voice* I\'m in.');
    console.log(`Agent ${client.user.username} signing in.`);
    client.updatePresence();
    
    let now = new Date();
    client.logger.log(now.toString());
    
    // Data
    for (const guildEntry of client.guilds) {
        let guild = guildEntry[1];
        await client.setUpServer(guild);
    }
    // REACTION LISTENER SETUP
    
    // WATER SETUP
    client.waterHandler.loadAll();
    client.waterHandler.startAll();
    
    // REMINDER SETUP
    await client.reminderHandler.loadAll();
    client.reminderHandler.filterReminders();
    client.reminderHandler.startAll();
    
    // CUSTOM FUNCTION SETUP
    client.customFunctionHandler.loadAll();
    
    // WEDNESDAY SETUP
    client.wednesdayHandler.start();
    
    // DUMP SETUP
}
