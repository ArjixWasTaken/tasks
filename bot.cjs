const Discord = require("discord.js-selfbot");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const client = new Discord.Client();
const token = process.env.DISCORD_TOKEN;

const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));


const formatSecondsToETA = (seconds) => {
    const day = 86400;
    const hour = 3600;
    const minute = 60;

    const days = Math.floor(seconds / day);
    const hours = Math.floor((seconds - days * day)/hour);
    const minutes = Math.floor((seconds - days * day - hours * hour)/minute);
    const remainingSeconds = seconds - days * day - hours * hour - minutes * minute;

    const strings = [
        days != 0 ? days + " Days" : "",
        hours != 0 ? hours + " Hours" : "",
        minutes != 0 ? minutes + " Minutes" : "",
        remainingSeconds != 0 ? remainingSeconds + " Seconds" : ""
    ].filter((i) => i != "")

    return strings.join(" and ")
}



var owner = null
const alertOwner = async (command) => {
    if (owner == null) {
        owner = client.users.cache.find((user) => user.id == process.env.OWNER_ID);
    }
    await owner.send("```json\n" + JSON.stringify(command, null, 3) + "\n```")
}

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
        const message = response.messages.find((res) => res[0].content == command)
        return new Date(message?.[0]?.timestamp).getTime() / 1000;
    } catch {
        return Date.now() / 1000 - 3600 * 24;
    }
};

const config = {
    "653624487530463233": [
        {
            channel: "664718764587089931",
            command: "//daily",
            enabled: true,
            interval: 24 * 3600,
        },
        {
            channel: "664718764587089931",
            command: ";daily",
            enabled: false,
            interval: 24 * 3600,
        },
    ]
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
                            alertOwner({serverId, command})
                            await sleep(1.5 * 1000);
                        } else {
                            console.log(
                                command.command,
                                formatSecondsToETA(command.interval - (Date.now() / 1000 - lastTimestamp))
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
