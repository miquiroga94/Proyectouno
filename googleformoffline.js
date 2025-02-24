const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

const credentials = JSON.parse(fs.readFileSync('credenciales.json'));
const tokens = JSON.parse(fs.readFileSync('tokens.json'));

const oAuth2Client = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);
oAuth2Client.setCredentials(tokens);

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Cargar mensajes respondidos desde un archivo
let respondedMessages = new Set();

function loadRespondedMessages() {
  if (fs.existsSync('respondedMessages.json')) {
    const data = JSON.parse(fs.readFileSync('respondedMessages.json'));
    respondedMessages = new Set(data);
  }
}

function saveRespondedMessages() {
  fs.writeFileSync('respondedMessages.json', JSON.stringify([...respondedMessages]));
}

client.on('ready', async () => {
  console.log('Bot ha iniciado correctamente');
  loadRespondedMessages();

  const channel = await client.channels.fetch('1328461067851927692'); // Canal 'registration'
  const messages = await channel.messages.fetch({ limit: 100 });

  messages.forEach(async (message) => {
    if (message.author.bot || respondedMessages.has(message.id)) return;
    if (message.id === '1337172711905955992') return; // Ignorar el mensaje fijo
    if (message.author.id === '1047296580845326436') return; // Ignorar mensajes del usuario específico
    if (message.content.trim().split(/\s+/).length > 4) return; // Ignorar mensajes con más de 4 palabras

    const keywordsPattern = /^(formdone|Formdone|form done|Form done|Form Done)$/i;

    if (keywordsPattern.test(message.content.trim())) {
      const discordUsername = message.author.username;
      console.log('Discord Username:', discordUsername);

      const isUsernameValid = await checkDiscordUsername(discordUsername);

      if (isUsernameValid) {
        console.log('Nombre de usuario válido, asignando rol...');
        const member = await message.guild.members.fetch(message.author.id);
        await member.roles.add('1315868465831346236'); // Asignar "Prime Member"
        await member.roles.remove('1335330120306524300'); // Eliminar "Potential Member"

        // Eliminar todos los mensajes del usuario en el canal 'registration'
        await deleteUserMessages(channel, message.author.id);

        // Redirigir al canal "general"
        const generalChannel = message.guild.channels.cache.get('1316269645988364338');
        generalChannel.send(`Welcome ${message.author} to Viral Creators Club!\n\nWe're glad you're here ❤️\n\nShare your TikTok and introduce yourself to help us customize offers and campaigns for you!`);
      } else {
        console.log('Error: nombre de usuario no válido');
        message.reply("Oops! It looks like there's an error in the form. Please make sure all the information is correct, including your Discord username. Once you fill it out again, send another message with the word formdone.");
      }

      respondedMessages.add(message.id);
      saveRespondedMessages();
    } else {
      message.reply("Make sure to type exactly 'formdone'. Please try again.");
      respondedMessages.add(message.id);
      saveRespondedMessages();
    }
  });
});

// 🔴 **Nueva función para borrar los mensajes de un usuario en el canal "registration"**
async function deleteUserMessages(channel, userId) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const userMessages = messages.filter(msg => msg.author.id === userId);

    for (const msg of userMessages.values()) {
      await msg.delete();
    }

    console.log(`Se eliminaron ${userMessages.size} mensajes de ${userId} en el canal registration.`);
  } catch (error) {
    console.error('Error al eliminar mensajes:', error);
  }
}

// Función para leer la hoja de cálculo
async function checkDiscordUsername(username) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1D1oWkZf4qPbXPp6YJxcCnsUuydnUWpSaZO1xMswvh-I',
      range: "'Form Responses 1'!C:C",
    });

    const usernames = res.data.values;
    console.log('Respuestas obtenidas:', usernames);
    return usernames ? usernames.some(row => row[0] === username) : false;
  } catch (error) {
    console.error('Error al leer los datos de la hoja de cálculo:', error);
    return false;
  }
}

client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ');
