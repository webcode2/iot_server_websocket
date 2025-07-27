import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import url from 'url';

import iotRoutes from './router/iot_Routes.js';
import authRoutes from './router/authRoutes.js';
import messageRoutes from './router/messageRoute.js';
import { pool } from './db/config.js';

import {
  socketAuthMiddleware,
  socketDisconect,
  registerNewConnection,
  socketDM,
  ReadNotification,
  getDeviceStatus,
} from './controller/socketController.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

app.use((req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress;
  console.log(`Incoming request from IP: ${ip}`);
  next();
});

// WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

// Store clients and their user info
const clients = new Map();

// Helper: send JSON
function sendJSON(ws, event, data) {
  ws.send(JSON.stringify({ event, data }));
}

// Authenticate and register connection
wss.on('connection', async (ws, req) => {
  ws.isAlive = true;

  // Parse jwtoken from query string
  const { query } = url.parse(req.url, true);
  const jwtoken = query.token;

  // Validate token immediately on connection
  const user = await socketAuthMiddleware({ token: jwtoken }, ws, req);
  if (!user) {
    sendJSON(ws, 'error', { message: 'Authentication failed: invalid or missing token' });
    ws.close();
    return;
  }
  
  ws.user = user;
  clients.set(ws, user);
  await registerNewConnection(ws);
  sendJSON(ws, 'auth_success', { user });

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (msg) => {
    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (e) {
      sendJSON(ws, 'error', { message: 'Invalid JSON' });
      return;
    }
    const { event, data } = parsed;

    // Now handle other events (no need to check auth again)
    switch (event) {
      case 'direct_message':
        socketDM({ recipientId: data.recipientId, message: data.message, ws, clients });
        break;

      // device
      case 'read_messages':
        console.log(ws.user)
        if (ws.user.account_type !== 'device') {
          sendJSON(ws, 'error', { message: 'Only devices can read messages' });
          return;
        }
        ReadNotification({ developerId: ws.user.developer_id, userId: ws.user.id, ws });
        break;

      case "heart_beat":
        getDeviceStatus({ ws, user: data.user, devices: data.devices });
        break

      default:
        console.log(data)
        sendJSON(ws, 'error', { message: 'Unknown event' });
    }
  });

  ws.on('close', () => {
    socketDisconect(ws);
    clients.delete(ws);
  });
});

// Heartbeat to detect dead connections
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Routes
app.use('/api/iot', iotRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/messages', messageRoutes);
app.get('/', (req, res) => res.json({ message: 'Welcome to the Home Assistant API' }));

const PORT = process.env.PORT || 4000;
async function startApp() {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log('Server ready on port ' + PORT);
      console.log('WebSocket server running at ws://localhost:' + PORT + '/ws');
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

startApp();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});