const { Client, GatewayIntentBits } = require('discord.js');

// Configuración
const TOKEN = 'MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'; // Token del bot
const GUILD_ID = '1315866198084419645'; // ID del servidor
const ROLE_ID = '1328693419643506798'; // ID del rol
const PRIVATE_CHANNEL_ID = '1328679562132979823'; // ID del canal privado
const KEY_CHANNEL_ID = '1316272658748280945'; // ID del canal de clave
const KEY_PHRASES = [
    "I'm in for $500",  // Usando comillas rectas
    'I’m in for $500',  // Usando comillas curvas
    "In in for $500",   // Nueva frase clave
    "I'm in for 500"    // Nueva frase clave
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

    // Monitorizar nuevos mensajes
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return; // Ignorar mensajes de otros bots
        if (message.channel.id === KEY_CHANNEL_ID) {
            await handleNewMessage(message);
        }
    });
});

// Función para manejar los nuevos mensajes
async function handleNewMessage(message) {
    // Verificar si el mensaje contiene alguna de las frases clave
    KEY_PHRASES.forEach(async (keyPhrase) => {
        if (message.content.includes(keyPhrase)) {
            const user = message.author;
            const member = await message.guild.members.fetch(user.id);

            // Asignar el rol si el usuario no lo tiene
            if (!member.roles.cache.has(ROLE_ID)) {
                console.log(`El usuario ${user.tag} no tiene el rol, asignando...`);
                await member.roles.add(ROLE_ID);
                console.log(`Rol asignado a ${user.tag}`);
            }

            // Añadir al canal privado si no está
            const privateChannel = await client.channels.fetch(PRIVATE_CHANNEL_ID);
            if (!privateChannel.members.has(user.id)) {
                await privateChannel.members.add(user);
                console.log(`Usuario ${user.tag} añadido al canal privado`);
            }

            // Responder al mensaje
            await message.reply({
                content: `I've added you to the channel ❤️`,
                allowedMentions: { users: [user.id] },
            });
            console.log(`Mensaje de respuesta enviado a ${user.tag}`);

            // Reaccionar al mensaje con un corazón
            await message.react('❤️');
            console.log(`Reacción de corazón añadida al mensaje de ${user.tag}`);
        }
    });
}

client.login(TOKEN);
