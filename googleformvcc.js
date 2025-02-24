const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

// Configurar el cliente de Google Sheets
const credentials = JSON.parse(fs.readFileSync('credenciales.json'));
const tokens = JSON.parse(fs.readFileSync('tokens.json'));

const oAuth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);
oAuth2Client.setCredentials(tokens);

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

// Configurar el cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Log para confirmar que el bot ha iniciado
client.on('ready', () => {
  console.log('Bot ha iniciado correctamente');
});

// Función para leer la hoja de cálculo
async function checkDiscordUsername(username) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1D1oWkZf4qPbXPp6YJxcCnsUuydnUWpSaZO1xMswvh-I',
      range: "'Form Responses 1'!C:C",
    });
    const usernames = res.data.values;
    console.log('Respuestas obtenidas:', usernames);
    if (usernames) {
      return usernames.some(row => row[0] === username);
    }
    return false;
  } catch (error) {
    console.error('Error al leer los datos de la hoja de cálculo:', error);
    return false;
  }
}

// Función para manejar mensajes en el canal 'registration'
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== '1328461067851927692') return;
  if (message.author.id === '1047296580845326436') return; // Ignorar mensajes de este usuario
  if (message.content.trim().split(/\s+/).length > 4) return; // Ignorar mensajes con más de 4 palabras

  console.log('Mensaje recibido:', message.content);

  // Obtener mensajes previos del usuario y las respuestas del bot
  const messages = await message.channel.messages.fetch({ limit: 100 });
  messages.forEach(async (msg) => {
    if (msg.author.id === message.author.id || msg.author.bot) {
      if (msg.id !== message.id) await msg.delete();
    }
  });

  if (message.content.trim() === 'formdone') {
    const discordUsername = message.author.username;
    console.log('Discord Username:', discordUsername);

    const isUsernameValid = await checkDiscordUsername(discordUsername);

    if (isUsernameValid) {
      console.log('Nombre de usuario válido, asignando rol...');
      const member = await message.guild.members.fetch(message.author.id);
      await member.roles.add('1315868465831346236'); // Asignar "Prime Member"
      await member.roles.remove('1335330120306524300'); // Eliminar "Potential Member"

      // Redirigir al canal "general"
      const generalChannel = message.guild.channels.cache.get('1316269645988364338');
      generalChannel.send(`Welcome ${message.author} to Viral Creators Club!\n\nWe're glad you're here ❤️\n\nShare your TikTok and introduce yourself to help us customize offers and campaigns for you!`);

      // Borrar TODOS los mensajes del usuario y las respuestas del bot en "registration"
      const messagesToDelete = await message.channel.messages.fetch({ limit: 100 });
      messagesToDelete.forEach(async (msg) => {
        if (msg.author.id === message.author.id || msg.author.bot) {
          await msg.delete();
        }
      });
    } else {
      console.log('Error: nombre de usuario no válido');
      message.reply("Oops! It looks like there's an error in the form. Please make sure all the information is correct, including your Discord username. Once you fill it out again, send another message with the word formdone.");
    }
  } else {
    message.reply("Make sure to type exactly 'formdone'. Please try again.");
  }
});

client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ');
