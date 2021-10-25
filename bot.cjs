const Discord = require("discord.js-selfbot");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const client = new Discord.Client();
const token = process.env.DISCORD_TOKEN;

const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));


const searchForLastMessage = async (guildId, channelId, command) => {
    const link = `https://discord.com/api/v9/guilds/${guildId}/messages/search?author_id=${client.user.id}&channel_id=${channelId}&content=${command}`;

    const response = await (
        await fetch(link, {
            headers: {
                authorization: token,
            },
        })
    ).json();
    try {
        return new Date(response.messages[0]?.[0]?.timestamp).getTime() / 1000;
    } catch {
        return Date.now() / 1000 - 360 * 24;
    }
};

const config = {
    "653624487530463233": [
        {
            channel: "664718764587089931",
            command: "//daily",
            enabled: false,
            interval: 24 * 360,
        },
        {
            channel: "664718764587089931",
            command: ";daily",
            enabled: false,
            interval: 24 * 360,
        },
    ],
    "815342964716470322": [
        {
            channel: "815342964716470325",
            command: "test",
            enabled: true,
            interval: 360,
        },
    ],
};

const claimDailies = async () => {
    for (let [serverId, commands] of Object.entries(config)) {
        const guild = client.guilds.cache.find((guild) => guild.id == serverId);

        if (guild) {
            for (let command of commands) {
                if (command.enabled) {
                    const channel = guild.channels.cache.find(
                        (channel) => channel.id == command.channel
                    );
                    if (channel) {
                        const lastTimestamp = await searchForLastMessage(
                            guild.id,
                            channel.id,
                            command.command
                        );
                        if (
                            Date.now() / 1000 - lastTimestamp >
                            command.interval
                        ) {
                            await channel.send(command.command);
                            await sleep(1.5 * 1000);
                        } else {
                            console.log(
                                command.interval -
                                    (Date.now() / 1000 - lastTimestamp)
                            );
                        }
                    }
                }
            }
        }
    }
    client.destroy();
};

client.on("ready", () => {
    claimDailies();
});

client.login(token);
