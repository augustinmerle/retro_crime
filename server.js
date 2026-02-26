const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// État partagé du board
let boardState = null;

app.use(express.static(__dirname));

// WebSocket : broadcast en temps réel
wss.on('connection', (ws) => {
  console.log('✅ Dev connecté — clients actifs :', wss.clients.size);

  // Envoie l'état actuel au nouveau client
  if (boardState) {
    ws.send(JSON.stringify({ type: 'INIT', data: boardState }));
  }

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'UPDATE') {
        boardState = msg.data;
        // Diffuse à tous les autres clients
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: 'UPDATE', data: boardState }));
          }
        });
      }
    } catch(e) {}
  });

  ws.on('close', () => {
    console.log('👋 Dev déconnecté — clients actifs :', wss.clients.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🔎 Rétro Crime Board lancé sur http://localhost:${PORT}`);
  console.log('👉 Lance ngrok avec : ngrok http ' + PORT);
  console.log('👉 Partage le lien ngrok à ton équipe\n');
});
