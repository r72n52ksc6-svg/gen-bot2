const Discord = require("discord.js");
const { Client, Intents, Permissions, Collection } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId } = require("./config.json");
const config = require('./config.json');
const fs = require("fs");
const premiumCooldowns = new Set();
const boosterCooldowns = new Set();
const server = require('./server.js');
const client = new Client({ 
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT
  ] 
});
const prefix = '$';

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (!message.guild) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        return message.channel.send('Pong!');
    }

    if (command === 'help') {
        const { MessageEmbed } = require('discord.js');
        const helpEmbed = new MessageEmbed()
            .setColor(config.color.default)
            .setTitle('Help Panel')
            .setDescription(`👋 Hello and welcome to **${message.guild.name}**! 🌟 We are here to provide you with the best services. 🚀`)
            .setImage(config.banner)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .addFields({
                name: `Commands`,
                value: "`$help` or `/help`   **Displays the help command**\n`$stock` or `/stock`  **View the current stock**\n`$premium <service>` or `/premium` **Generate premium reward**\n`$booster <service>` or `/booster` **Generate booster reward**\n`/create` **Create a new service (Admin)**\n`/add` **Add accounts to stock (Admin)**"
            })
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
            .setTimestamp()
            .addFields({ name: 'Useful Links', value: '[**Discord**](https://discord.gg/VeGhtAjXY7)' });

        return message.channel.send({ embeds: [helpEmbed] });
    }

    if (command === 'stock') {
        const { MessageEmbed } = require('discord.js');
        const fs = require('fs').promises;

        const getStock = async (directory) => {
            try {
                const files = await fs.readdir(directory);
                return files.filter(file => file.endsWith('.txt'));
            } catch (err) {
                console.error('Unable to scan directory: ' + err);
                return [];
            }
        };

        const getServiceInfo = async (directory, stock) => {
            const info = [];
            for (const service of stock) {
                const serviceContent = await fs.readFile(`${directory}/${service}`, 'utf-8');
                const lines = serviceContent.split(/\r?\n/);
                info.push(`**${service.replace('.txt', '')}:** \`${lines.length}\``);
            }
            return info.join('\n');
        };

        const freeStock = await getStock(`${__dirname}/free/`);
        const premiumStock = await getStock(`${__dirname}/premium/`);
        const BoosterStock = await getStock(`${__dirname}/Booster/`);

        const embed = new MessageEmbed()
            .setColor(config.color.default)
            .setTitle(`${message.guild.name} Service Stock`)
            .setDescription(`👋 Hello and welcome to **${message.guild.name}**! 🌟 We are here to provide you with the best services. 🚀`)
            .setFooter(config.footer)
            .setImage(config.banner);

        if (freeStock.length > 0) {
            const freeStockInfo = await getServiceInfo(`${__dirname}/free/`, freeStock);
            embed.addFields({ name: 'Free Services', value: freeStockInfo, inline: true });
        }

        if (premiumStock.length > 0) {
            const premiumStockInfo = await getServiceInfo(`${__dirname}/premium/`, premiumStock);
            embed.addFields({ name: 'Premium Services', value: premiumStockInfo, inline: true });
        }

        if (BoosterStock.length > 0) {
            const BoosterStockinfo = await getServiceInfo(`${__dirname}/Booster/`, BoosterStock);
            embed.addFields({ name: 'Booster Services', value: BoosterStockinfo, inline: true });
        }

        embed.addFields({ name: 'Useful Links', value: `[**Discord**](https://discord.gg/GRUfQrxvCJ)` });

        return message.channel.send({ embeds: [embed] });
    }

    if (command === 'premium') {
        const { MessageEmbed } = require('discord.js');
        const fs = require('fs');
        const service = args[0];

        if (!service) {
            const noServiceEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Missing argument!')
                .setDescription('Please specify a service! Example: `$premium servicename`')
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [noServiceEmbed] });
        }

        if (message.channelId !== config.premiumChannel) {
            const wrongChannelEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Wrong command usage!')
                .setDescription(`You cannot use the \`$premium\` command in this channel! Try it in <#${config.premiumChannel}>!`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [wrongChannelEmbed] });
        }

        if (premiumCooldowns.has(message.author.id)) {
            const cooldownEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait **${config.premiumCooldown}** seconds before executing that command again!`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [cooldownEmbed] });
        }

        const filePath = `${__dirname}/premium/${service}.txt`;

        fs.readFile(filePath, 'utf-8', (error, data) => {
            if (error) {
                const notFoundEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`Service \`${service}\` does not exist!`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();
                return message.channel.send({ embeds: [notFoundEmbed] });
            }

            const lines = data.split(/\r?\n/);

            if (lines.length <= 1) {
                const emptyServiceEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`The \`${service}\` service is empty!`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();
                return message.channel.send({ embeds: [emptyServiceEmbed] });
            }

            const generatedAccount = lines[0];
            lines.shift();
            const updatedData = lines.join('\n');

            fs.writeFile(filePath, updatedData, (writeError) => {
                if (writeError) {
                    console.error(writeError);
                    return message.channel.send('An error occurred while redeeming the account.');
                }

                const embedMessage = new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Generated Premium account')
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setDescription('🙏 Thank you so much for being a premium member! \n 🌟 Your support means the world to us! 💖😊')
                    .addFields(
                        { name: 'Service', value: `\`\`\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\`\`\``, inline: true },
                        { name: 'Account', value: `\`\`\`${generatedAccount}\`\`\``, inline: true }
                    )
                    .setImage(config.banner)
                    .setTimestamp();

                message.author.send({ embeds: [embedMessage] })
                    .catch(error => console.error(`Error sending embed message: ${error}`));
                message.channel.send({
                    content: `**Check your DM ${message.author}!** __If you do not receive the message, please unlock your private!__`,
                });

                premiumCooldowns.add(message.author.id);
                setTimeout(() => {
                    premiumCooldowns.delete(message.author.id);
                }, config.premiumCooldown * 1000);
            });
        });
    }

    if (command === 'booster') {
        const { MessageEmbed } = require('discord.js');
        const fs = require('fs');
        const service = args[0];

        if (!service) {
            const noServiceEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Missing argument!')
                .setDescription('Please specify a service! Example: `$booster servicename`')
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [noServiceEmbed] });
        }

        if (message.channelId !== config.BoosterChannel) {
            const wrongChannelEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Wrong command usage!')
                .setDescription(`You cannot use the \`$booster\` command in this channel! Try it in <#${config.BoosterChannel}>!`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [wrongChannelEmbed] });
        }

        if (boosterCooldowns.has(message.author.id)) {
            const cooldownEmbed = new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Cooldown!')
                .setDescription(`Please wait **${config.BoosterCooldown}** seconds before executing that command again!`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [cooldownEmbed] });
        }

        const filePath = `${__dirname}/Booster/${service}.txt`;

        fs.readFile(filePath, 'utf-8', (error, data) => {
            if (error) {
                const notFoundEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`Service \`${service}\` does not exist!`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();
                return message.channel.send({ embeds: [notFoundEmbed] });
            }

            const lines = data.split(/\r?\n/);

            if (lines.length <= 1) {
                const emptyServiceEmbed = new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Generator error!')
                    .setDescription(`The \`${service}\` service is empty!`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setTimestamp();
                return message.channel.send({ embeds: [emptyServiceEmbed] });
            }

            const generatedAccount = lines[0];
            lines.shift();
            const updatedData = lines.join('\n');

            fs.writeFile(filePath, updatedData, (writeError) => {
                if (writeError) {
                    console.error(writeError);
                    return message.channel.send('An error occurred while redeeming the account.');
                }

                const embedMessage = new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Generated Booster account')
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                    .setDescription('🙏 Thank you so much for being a Booster member! \n 🌟 Your support means the world to us! 💖😊')
                    .addFields(
                        { name: 'Service', value: `\`\`\`${service[0].toUpperCase()}${service.slice(1).toLowerCase()}\`\`\``, inline: true },
                        { name: 'Account', value: `\`\`\`${generatedAccount}\`\`\``, inline: true }
                    )
                    .setImage(config.banner)
                    .setTimestamp();

                message.author.send({ embeds: [embedMessage] })
                    .catch(error => console.error(`Error sending embed message: ${error}`));
                message.channel.send({
                    content: `**Check your DM ${message.author}!** __If you do not receive the message, please unlock your private!__`,
                });

                boosterCooldowns.add(message.author.id);
                setTimeout(() => {
                    boosterCooldowns.delete(message.author.id);
                }, config.BoosterCooldown * 1000);
            });
        });
    }
});


client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(`${config.status}`, { type: "WATCHING" }); // Set the bot's activity status
    /* You can change the activity type to:
     * LISTENING
     * WATCHING
     * COMPETING
     * STREAMING (you need to add a twitch.tv url next to type like this:   { type: "STREAMING", url: "https://twitch.tv/twitch_username_here"} )
     * PLAYING (default)
    */
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.token);

