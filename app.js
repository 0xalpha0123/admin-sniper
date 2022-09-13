require('dotenv').config();
const { Telegraf } = require('telegraf')
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const bot = new Telegraf(process.env.TG_BOT_TOKEN)

bot.command('start', async ctx => {
    let stringSession = '';

    let client = new TelegramClient(
        new StringSession( stringSession ),
        Number(process.env.API_ID),
        process.env.API_HASH,
        { connectionRetries: 5 }
    );

    await client.start( {
        botAuthToken: process.env.TG_BOT_TOKEN,
    });

    bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {
    })

    stringSession = client.session.save()

    bot.command('server', async ctx => {
        const groupName = getSearchGroupName(ctx.message.text.replace("/server", "").replace(/^\s+|\s+$/g,''));
        console.log(ctx.message.text.replace("/server", "").replace(/^\s+|\s+$/g,''))

        let adminsList;
        

        try {
            /* @link: https://gram.js.org/tl/channels/GetParticipants */

            await client.connect();

            const response = await client.invoke(
                new Api.channels.GetParticipants( {
                    channel: groupName,
                    filter: new Api.ChannelParticipantsAdmins(),
                    offset: 0,
                    limit: 100,
                    hash: 0,
                } )
            );
            adminsList = response.participants.map( ( { userId, rank } ) => ( {
                id: userId.value.toString(),
                rank,
            } ) );

            adminsList = adminsList.map( ( { id, rank } ) => {
                const userDetails = response.users.find( user => user.id.value.toString() === id );
                const { bot, firstName, lastName, username } = userDetails;

                return {
                    id,
                    bot,
                    firstName,
                    lastName,
                    rank,
                    username,
                };
            } ).filter(admin => !admin.bot);

            let message = ""

            for (let i = 0; i < adminsList.length; i ++) {
                message += `${i} ID: ${adminsList[i].id} First Name: ${adminsList[i].firstName} Last Name: ${adminsList[i].lastName} Rank: ${adminsList[i].rank} Username: @${adminsList[i].username}\n`
            }

            bot.telegram.sendMessage(ctx.chat.id, `${message}`, {
            })
        }
        catch ( error ) {
            console.log(error)
        }

    })
})


const getSearchGroupName = ( value ) => {
    const match = /.*webk\.telegram.*@(?<webClient>.+)$|.*t.me\/(?<shortLink>.+)$|^@(?<userName>.+)$/.exec( value );

    return match
        ? ( match.groups.webClient || match.groups.shortLink || match.groups.userName )
        : '';
}

bot.launch()