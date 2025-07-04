// === IMPORTS ===
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const cors = require('cors');
const iotRoutes = require("./router/iot_Routes.js");
const authRoutes = require("./router/authRoutes.js");
const { pool } = require('./db/config');
const {
  socketDM,
  socketDisconect,
  registerNewConnection,
  socketRetreiveTodaysAttendance,
  addAttendantLog,
  socketAuthMiddleware
} = require("./socket/socketController.js");

// === EXPRESS + HTTP SERVER ===
const app = express();
const server = http.createServer(app);

// === WEBSOCKET SERVER ===
const wss = new WebSocket.Server({ noServer: true });

// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// === Logging ===
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  console.log(`Incoming request from IP: ${ip}`);
  next();
});

// === REST ROUTES ===
app.use('/api/iot', iotRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.json({ message: 'Welcome to the Home Assistant API' }));

// === Upgrade handler for WS ===
server.on('upgrade', async (request, socket, head) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token =
      url.searchParams.get('token') ||
      (request.headers.authorization && request.headers.authorization.split(' ')[1]);

    const user = await socketAuthMiddleware(token);
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.user = user; // Attach user for later use
      wss.emit('connection', ws, request);
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    socket.destroy();
  }
});


// === WebSocket connection logic ===
wss.on('connection', async (ws, request) => {
  console.log(`New WS connection from: ${ws.user.id}`);
  await registerNewConnection(ws);
  console.log("my resting messages----------------")
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'direct_message':
          console.log(`DM from ${ws.user.id}: ${JSON.stringify(data)}`);
          await socketDM(data.recipientId, data.message, ws, wss);
          break;
        case "log_attendace":
          console.log("loggin attendance")
          addAttendantLog({ data: data, developer_id: socket.user.developer_id })

        default:
          console.log('Unknown message type:', data.event);
      }
    } catch (err) {
      console.error('Failed to process message:', err);
    }
  });

  ws.on('close', () => {
    socketDisconect(ws);
  });

  // Optional: send greeting
  ws.send(JSON.stringify({ type: 'connection_ack', message: 'Connected successfully' }));
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;

async function startApp() {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server ready on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

startApp();

// === Graceful shutdown ===
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
