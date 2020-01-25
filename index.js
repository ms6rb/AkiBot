const { Client } = require("discord.js");
const { prefix, region, token } = require("./config");
const lang = require("./lang");
const { startAki, endGame, oldCollects, text } = require("./functions")
const client = new Client();


client.on('ready', () => {
    console.log(`I\'m Online As ${client.user.tag}...!`);
    if (region !== 'ar' && region !== 'en') text = lang['ar'];
});

client.on('error', console.error);

const coolDownList = new Set();

client.on("message", async message => {
    if (message.content.indexOf(prefix) !== 0) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command == 'aki') {

        if (args[0] == 'start') {

            if (coolDownList.has(message.author.id)) return;
            else {
                coolDownList.add(message.author.id);
                if (oldCollects[message.author.id]) return message.reply(text.openGame);
                var akiMsg = await message.channel.send(text.wait)
                startAki(message, akiMsg);

                setTimeout(() => {
                    coolDownList.delete(message.author.id);
                }, 5000);
            }
            
        } else if (args[0] == 'stop') {
            if (!oldCollects[message.author.id]) return message.reply(text.noGame);
            endGame(message.author.id, oldCollects[message.author.id].akiMsg)
        }

    }
});




client.login(token);
