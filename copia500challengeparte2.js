const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

// Configuración
const TOKEN = 'MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'; // Token del bot
const GUILD_ID = '1315866198084419645'; // ID del servidor
const ROLE_ID = '1328693419643506798'; // ID del rol
const PRIVATE_CHANNEL_ID = '1328679562132979823'; // ID del canal privado
const KEY_CHANNEL_ID = '1316272658748280945'; // ID del canal de clave
const KEY_PHRASES = [
    "I'm in for $500",
    'I’m in for $500',
    "I'm in for 500$",
    'I’m in for 500$',
    'I’m in for 500',
    'Im in for 500$',
    'im in for $500',
    "In in for $500",
    "I'm in for 500"
]; // Frases clave

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    // Revisión de mensajes antiguos en el canal de clave
    await checkOldMessages();
});

// Función para revisar mensajes antiguos en el canal de clave (sin responder a los nuevos mensajes)
async function checkOldMessages() {
    console.log('Iniciando la revisión de mensajes en el canal de clave...');
    const channel = await client.channels.fetch(KEY_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 100 }); // Traemos los últimos 100 mensajes

    let updatedUsers = 0;

    // Revisar los mensajes antiguos
    for (const message of messages.values()) {
        KEY_PHRASES.forEach(async (keyPhrase) => {
            if (message.content.trim() === keyPhrase && !message.reactions.cache.has('❤️')) {
                const user = message.author;
                const member = await message.guild.members.fetch(user.id);

                // Asignar el rol si el usuario no lo tiene
                if (!member.roles.cache.has(ROLE_ID)) {
                    console.log(`El usuario ${user.tag} no tiene el rol, asignando...`);
                    await member.roles.add(ROLE_ID);
                    console.log(`Rol asignado a ${user.tag}`);
                }

                // Configurar permisos en el canal privado
                const privateChannel = await client.channels.fetch(PRIVATE_CHANNEL_ID);
                const permissions = privateChannel.permissionOverwrites.resolve(user.id);

                if (!permissions || !permissions.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                    await privateChannel.permissionOverwrites.create(user.id, {
                        ViewChannel: true,
                        SendMessages: true,
                    });
                    console.log(`Permisos otorgados al usuario ${user.tag} en el canal privado`);
                }

                // Responder al mensaje
                await message.reply({
                    content: `I've added you to the channel ❤️`,
                    allowedMentions: { users: [user.id] },
                });
                console.log(`Mensaje de respuesta enviado a ${user.tag}`);

                // Reaccionar al mensaje
                await message.react('❤️');
                console.log(`Reacción de corazón añadida al mensaje de ${user.tag}`);

                updatedUsers++;
            }
        });
    }

    console.log(`Se han actualizado ${updatedUsers} usuarios con el rol específico y acceso al canal privado.`);
}

client.login(TOKEN);
