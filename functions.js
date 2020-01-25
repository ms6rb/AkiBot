const aki = require('aki-api');
const { RichEmbed } = require("discord.js");
const { region } = require("./config");
const lang = require("./lang");

let text = lang[region];
let oldCollects = {};


async function startAki(message, akiMsg) {
    try {
        /////////////////// Game Start ///////////////////////////////
        const data = await aki.start(region); // Start Game
        let session = data.session;
        let signature = data.signature;
        //////////////////////////////////////////////////////////////

        const embed = new RichEmbed()
            .setAuthor(data.question, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
            .setFooter(`Send By: ${message.author.tag}`, message.guild.iconURl)
            .setTimestamp()
            .addField(`${text.q} 1`, text.options)
            .setThumbnail('https://ar.akinator.com/bundles/elokencesite/images/akitudes_670x1096/defi.png?v95')
            .setColor("#ffffff")

        
                const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '↩', '⏹'];
                let filters = [];
                let x = 0;
                while (x < 7) {
                    let emo = emojis[x];
                    await akiMsg.react(emo);
                    await collectors(message.author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === message.author.id, {
                        time: 0
                    }), session, signature, 0, null, null, data);
                    x++
                }
                await akiMsg.edit({embed: embed});

    } catch (err) {
        console.log(err);

    }
}

async function collectors(author, akiMsg, collector, session, signature, step, oldWin, enter, data) {
    try {
        
        if (!oldWin) oldWin = null;
        if (!oldCollects[author.id]) {
            oldCollects[author.id] = {
                c: [],
                date: Date.now(),
                lastid: [],
                q1Question: data.question,
                q1Session: data.session,
                akiMsg: akiMsg,
                wait: 3
            }
        }
        await oldCollects[author.id].c.push(collector);

        collector.on('collect', async r => {
            r.remove(author);
            let answerId;
            if (r.emoji.name == '1⃣') answerId = 0;
            else if (r.emoji.name == '2⃣') answerId = 1;
            else if (r.emoji.name == '3⃣') answerId = 2;
            else if (r.emoji.name == '4⃣') answerId = 3;
            else if (r.emoji.name == '5⃣') answerId = 4;
            else if (r.emoji.name == '⏹') {
                await endGame(author.id, akiMsg);
                return;
            } else if (r.emoji.name == '↩') {
                Back(author, akiMsg, session, signature, answerId, step)
                return;
            } else if (r.emoji.name == '✅') {
                const embed = new RichEmbed()
                    .setAuthor(text.correctGuess, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
                    .addField(text.name, oldWin.name, true)
                    .addField(text.dis, oldWin.dis, true)
                    .addField(text.rank, oldWin.rank, true)
                    .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
                    .setThumbnail('https://ar.akinator.com/bundles/elokencesite/images/akitudes_670x1096/triomphe.png?v95')
                    .setTimestamp()
                    .setImage(oldWin.img)
                    .setColor("#ffffff")
                akiMsg.edit({
                    embed: embed
                });
                akiMsg.clearReactions().then(async m => {
                    oldCollects[author.id].c.map(async c => await c.stop());
                    delete oldCollects[author.id];
                });
                return;
            } else if (r.emoji.name == '❎') {
                akiMsg.clearReactions()
                    .then(async msg => {
                        const emojiss = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '↩', '⏹'];
                        oldCollects[author.id].date = Date.now();
                        oldCollects[author.id].c.map(async c => await c.stop());
                        oldCollects[author.id].c = [];
                        let x = 0;
                        while (x < 7) {
                            let emo = emojiss[x];
                            await msg.react(emo)
                            await collectors(author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === author.id, {
                                time: 0
                            }), session, signature, step)
                            x++
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                return Next(author, akiMsg, session, signature, answerId, step + 1, true);
            }
            Next(author, akiMsg, session, signature, answerId, step, false);

        });
    } catch (err) {
        console.log(err);
        akiMsg.edit(`**Somthing Get Wrong... ERR404!!!**`, {embed: null})
    }
}


async function Next(author, akiMsg, session, signature, answerId, step, enter) {

    try {
        /////////////////// Next Answer ///////////////////////////////
        oldCollects[author.id].c.map(async c => await c.stop());
        oldCollects[author.id].c = [];

        const nextInfo = await aki.step(region, session, signature, answerId, step);
        //////////////////////////////////////////////////////////////

        if (enter == true) oldCollects[author.id].wait--
        if (oldCollects[author.id].wait == 0) {
            enter = false;
            oldCollects[author.id].wait = 3
        }

        if (nextInfo.progress >= 90 && enter !== true) {

            const win = await aki.win(region, session, signature, step + 1);

            let firstGuess = win.answers[0];
            const lastIds = oldCollects[author.id].lastid
            let x = lastIds.length;

            if (lastIds.includes(firstGuess.id)) firstGuess = win.answers[x];

            if (firstGuess == undefined) {
                Loser(author, akiMsg)
            } else {
                oldCollects[author.id].lastid.push(firstGuess.id);
                const embed = new RichEmbed()
                    .setAuthor(text.iThinkOf, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
                    .addField(text.name, firstGuess.name, true)
                    .addField(text.dis, firstGuess.description, true)
                    .addField(text.rank, firstGuess.ranking, true)
                    .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
                    .setThumbnail('https://ar.akinator.com/bundles/elokencesite/images/akitudes_670x1096/confiant.png')
                    .setTimestamp()
                    .setImage(firstGuess.absolute_picture_path)
                    .setColor("#ffffff")
                akiMsg.edit({
                    embed: embed
                });
                akiMsg.clearReactions().then(async m => {
                        const emojis = ['✅', '❎'];
                        oldCollects[author.id].date = Date.now();
                        let x = 0;
                        while (x < 2) {
                            let emo = emojis[x];
                            await m.react(emo)
                            await collectors(author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === author.id, {
                                time: 0
                            }), session, signature, nextInfo.nextStep, {
                                'name': firstGuess.name,
                                'dis': firstGuess.description,
                                'rank': firstGuess.ranking,
                                'img': firstGuess.absolute_picture_path
                            })
                            x++
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    });
            }
        } else {
            const embed = new RichEmbed()
                .setAuthor(nextInfo.nextQuestion, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
                .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
                .setThumbnail(author.avatarURL)
                .setTimestamp()
                .addField(`${text.q} ${nextInfo.currentStep+2}`, text.options)
                .setColor("#ffffff")
            akiMsg.edit({
                    embed: embed
                })
                .then(async msg => {
                    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '↩', '⏹'];
                    oldCollects[author.id].date = Date.now();
                    let x = 0;
                    while (x < 7) {
                        let emo = emojis[x];
                        await collectors(author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === author.id, {
                            time: 0
                        }), session, signature, nextInfo.nextStep, null, enter)
                        x++
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    } catch (err) {
        console.log(err);

    }
}

async function Back(author, akiMsg, session, signature, answerId, step) {

    try {

        if (step == 0) return;

        else if (step == 1) {
            oldCollects[author.id].c.map(async c => await c.stop());
            oldCollects[author.id].c = [];

            const embed = new RichEmbed()
                .setAuthor(oldCollects[author.id].q1Question, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
                .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
                .setThumbnail(author.avatarURL)
                .setTimestamp()
                .addField(`${text.q} ${step}`, text.options)
                .setColor("#ffffff")
            akiMsg.edit({
                    embed: embed
                })
                .then(async msg => {
                    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '↩', '⏹'];
                    oldCollects[author.id].date = Date.now();
                    let x = 0;
                    while (x < 7) {
                        let emo = emojis[x];
                        await collectors(author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === author.id, {
                            time: 0
                        }), oldCollects[author.id].q1Session, signature, 0)
                        x++
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            /////////////////// Back Answer ///////////////////////////////
            oldCollects[author.id].c.map(async c => await c.stop());
            oldCollects[author.id].c = [];

            const previousStep = await aki.back(region, session, signature, answerId, step);
            //////////////////////////////////////////////////////////////

            const embed = new RichEmbed()
                .setAuthor(previousStep.nextQuestion, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
                .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
                .setThumbnail(author.avatarURL)
                .setTimestamp()
                .addField(`${text.q} ${step}`, text.options)
                .setColor("#ffffff")
            akiMsg.edit({
                    embed: embed
                })
                .then(async msg => {
                    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '↩', '⏹'];
                    oldCollects[author.id].date = Date.now();
                    let x = 0;
                    while (x < 7) {
                        let emo = emojis[x];
                        await collectors(author, akiMsg, akiMsg.createReactionCollector((reaction, user) => reaction.emoji.name == emo && user.id === author.id, {
                            time: 0
                        }), session, signature, previousStep.nextStep)
                        x++
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    } catch (err) {
        console.log(err);
    }
}

async function Loser(author, akiMsg) {
    const embed = new RichEmbed()
        .setAuthor(text.giveUp, "https://botlist.imgix.net/3147/c/Akinator-chatbot-medium.jpg")
        .setFooter(`Send By: ${author.tag}`, akiMsg.guild.iconURl)
        .setImage('https://ar.akinator.com/bundles/elokencesite/images/akitudes_670x1096/deception.png')
        .setTimestamp()
        .setColor("#ffffff")
    akiMsg.edit({
        embed: embed
    });
    akiMsg.clearReactions().then(async m => {
        oldCollects[author.id].c.map(async c => await c.stop());
        delete oldCollects[author.id];
    });
    return;
}

async function endGame(authorId, akiMsg) {

    oldCollects[authorId].c.map(async c => await c.stop());
    delete oldCollects[authorId];
    await akiMsg.clearReactions();
    await akiMsg.edit(text.gameClosed, {
        embed: null
    })
    return;
}

module.exports = { startAki, collectors, oldCollects, text }
