const { Client, GatewayIntentBits } = require('discord.js');

// Configuración
const TOKEN = 'MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'; // Token del bot
const GUILD_ID = '1315866198084419645'; // ID del servidor
const ROLE_ID = '1328865636369043547'; // ID del rol
const CHANNEL_ID = '1326641093470584842'; // ID del canal

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.on('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    // Revisión de los usuarios en el canal de texto
    await checkMembers();
});

// Función para revisar los miembros en el canal de texto
async function checkMembers() {
    console.log('Iniciando revisión de miembros en el canal...');
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(CHANNEL_ID); // Obtiene el canal de texto por ID

    // Obtiene todos los miembros del servidor
    const members = await guild.members.fetch();

    let updatedUsers = 0;

    // Filtra los miembros que están en el canal de texto
    const channelMembers = channel.members;

    // Revisa a todos los miembros del servidor
    members.forEach(async (member) => {
        if (channelMembers.has(member.id)) {
            // Si el miembro está en el canal y no tiene el rol, asigna el rol
            if (!member.roles.cache.has(ROLE_ID)) {
                console.log(`El usuario ${member.user.tag} no tiene el rol, asignando...`);
                await member.roles.add(ROLE_ID);
                console.log(`Rol asignado a ${member.user.tag}`);
                updatedUsers++;
            }
        }
    });

    console.log(`Se han actualizado ${updatedUsers} usuarios con el rol especificado.`);
}

client.login(TOKEN);
