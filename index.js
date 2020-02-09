const {
    Client
} = require("discord.js");
const {
    prefix,
    region,
    token
} = require("./config");
const lang = require("./lang");
const {
    startAki,
    endGame,
    checkTime,
    oldCollects,
    text
} = require("./functions")
const client = new Client();


client.on('ready', () => {
    console.log(`I\'m Online As ${client.user.tag}...!`);
    if (region !== 'ar' && region !== 'en') text = lang['ar'];
    setInterval(checkTime, 180000);
});

client.on('error', console.error);

const coolDownList = new Set();

client.on("message", async msg => {
    if (msg.content.indexOf(prefix) !== 0) return;
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command == 'aki') {

        if (args[0] == 'start') {

            if (coolDownList.has(msg.author.id)) return;
            else {
                coolDownList.add(msg.author.id);
                if (oldCollects[msg.author.id]) {
                    msg.reply(text.openGame);
                    return coolDownList.delete(msg.author.id);
                } 

                if (!msg.channel.memberPermissions(msg.guild.me).has(['ADD_REACTIONS', 'SEND_MESSAGES'])) {
                    coolDownList.delete(msg.author.id);
                    try {
                        msg.channel.send(text.noPerm);
                        msg.author.send(text.noPerm)
                    } catch (err) {
                        //lol
                    };
                    return;
                }


                var akiMsg = await msg.channel.send(text.wait)
                startAki(msg, akiMsg);

                setTimeout(() => {
                    coolDownList.delete(msg.author.id);
                }, 5000);
            }

        } else if (args[0] == 'stop') {
            if (!oldCollects[msg.author.id]) return msg.reply(text.noGame);
            endGame(msg.author.id, oldCollects[msg.author.id].akiMsg)
        }

    }
});




client.login(token);