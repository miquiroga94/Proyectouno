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
  client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'); // Token del bot
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
      client.login('MTMyMTI2MDAxODQ3MzEwNzUzNw.GcA9va.K3e1QQdacgvgG1X9SJh4BJjVHfNQ8rNmkhCnxQ'); // Token del bot
    });
  });
}

// ID de la hoja de cálculo
const spreadsheetId = '19UBYUzHt9bT_eiGMXL54mvdepEM66bl9QteLJ7s8rGM'; // ID de la hoja de cálculo
const targetGuildId = '1315866198084419645'; // ID del servidor

// Crear cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Función para revisar usuarios que han salido
async function checkLeftMembers(auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Obtener datos existentes de la hoja
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:C', // Asegúrate de que este rango incluya las columnas relevantes
    });

    const rows = res.data.values || [];
    const guild = await client.guilds.fetch(targetGuildId);
    const members = await guild.members.fetch();

    const currentMemberIds = members.map(member => member.user.id);

    // Actualizar el estado de los usuarios que han salido
    for (let i = 0; i < rows.length; i++) {
      const userId = rows[i][1]; // Columna B: ID de usuario
      const status = rows[i][2]; // Columna C: Estado actual

      if (!currentMemberIds.includes(userId) && status !== 'Left') {
        rows[i][2] = 'Left'; // Cambiar el estado a "Left"
        console.log(`Usuario marcado como "Left": ${rows[i][0]}`); // Columna A: Nombre de usuario
      }
    }

    // Sobrescribir los datos actualizados en la hoja
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A2:C',
      valueInputOption: 'RAW',
      resource: { values: rows },
    });

    console.log('Revisión completada. Usuarios actualizados.');
  } catch (err) {
    console.error('Error al revisar usuarios:', err);
  }
}

// Cuando el bot esté listo
client.once('ready', async () => {
  console.log('Bot conectado y listo.');

  // Revisión inicial de usuarios que han salido
  checkLeftMembers(oAuth2Client);

  // Configura un intervalo para revisar periódicamente
  setInterval(() => {
    checkLeftMembers(oAuth2Client);
  }, 1000 * 60 * 10); // Cada 10 minutos
});
