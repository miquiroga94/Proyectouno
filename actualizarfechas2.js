const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const { Client, GatewayIntentBits } = require('discord.js');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json'; // Este archivo almacenará el token de acceso

// Cargar las credenciales del cliente OAuth
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Comprobar si hay un token almacenado
fs.readFile(TOKEN_PATH, (err, token) => {
  if (err) return getNewToken(oAuth2Client);
  oAuth2Client.setCredentials(JSON.parse(token));
  client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'); // Reemplaza con el token de tu bot
});

// Si no hay un token, obtener uno nuevo
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.log('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.log(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'); // Reemplaza con el token de tu bot
    });
  });
}

// Función para agregar un retraso
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ID de la hoja de cálculo copiada
const spreadsheetId = '19UBYUzHt9bT_eiGMXL54mvdepEM66bl9QteLJ7s8rGM'; // Reemplaza con el ID de tu hoja copiada

// Nuevos roles a añadir
const newRoles = ['500 Challenge Participant', 'Exclusive'];

// Llama a la API de Google Sheets para actualizar las fechas y ordenar las filas
async function updateSheet(auth, member) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Obtener datos existentes de la hoja
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:J', // Rango completo de datos
    });

    const rows = res.data.values || [];
    const memberIndex = rows.findIndex(row => row[1] === member.user.id);

    // Roles actuales del miembro
    const currentRoles = member.roles.cache.map(role => role.name);

    if (memberIndex >= 0) {
      // Actualizar roles en la tabla
      let rolesColumn = rows[memberIndex][7].split(', ');

      // Añadir nuevos roles si no están presentes
      newRoles.forEach(role => {
        if (currentRoles.includes(role) && !rolesColumn.includes(role)) {
          rolesColumn.push(role);
        }
      });

      // Eliminar roles que ya no tenga
      rolesColumn = rolesColumn.filter(role => currentRoles.includes(role));

      // Actualizar la columna de roles
      rows[memberIndex][7] = rolesColumn.join(', ');
    } else {
      // Si el usuario no está en la tabla, añadirlo con los roles
      rows.push([
        member.user.tag,          // Discord User
        member.user.id,           // ID
        'Joined',                 // Status
        member.joinedAt.toISOString().replace('T', ' T'), // Join Date
        '',                       // Leave Date
        '',                       // Reason
        '',                       // Rejoin Date
        currentRoles.join(', '),  // Roles
        '',                       // TikTok User
        '',                       // Comments
      ]);
    }

    // Ordenar las filas por fecha de unión (columna 4)
    rows.sort((a, b) => new Date(a[3]) - new Date(b[3]));

    // Sobrescribir toda la tabla con los datos actualizados
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A2:J',
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    console.log(`Información actualizada para ${member.user.tag}`);
  } catch (err) {
    console.error('Error al actualizar la hoja de cálculo:', err);
  }
}

// Configurar el cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const targetGuildId = '1315866198084419645'; // Reemplaza con el ID de tu servidor

client.once('ready', async () => {
  console.log('Bot conectado y listo.');

  const targetGuild = client.guilds.cache.get(targetGuildId);

  if (!targetGuild) {
    console.log('El bot no está conectado al servidor especificado.');
    return;
  }

  // Obtener todos los miembros del servidor
  const members = await targetGuild.members.fetch();

  // Actualizar los datos de todos los miembros con un retraso
  for (const member of members.values()) {
    await updateSheet(oAuth2Client, member);
    await delay(200); // Retraso de 0.2 segundos
  }

  console.log('Actualización inicial completada.');
});

client.on('guildMemberAdd', async (member) => {
  if (member.guild.id === targetGuildId) {
    await updateSheet(oAuth2Client, member);
  }
});
