import WebSocket from 'ws';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import cors from 'cors';

import { pool } from './db/config.js';

import {
  socketAuthMiddleware,
  socketDisconect,
  registerNewConnection,
  addAttendantLog,
  createNewNotification,
  ReadNotification,
} from './controller/socketController.js';
import authRoutes from './router/authRoutes.js'; // 
import iotRoutes from './router/iot_Routes.js'; // 
import libStudentRoutes from "./router/library/studentRoute.js"
import { socketDM } from "./controller/socketController.js";
import { authMiddleware } from "./utils/authMiddleware.js";
import { registerStudentfinerPrint } from "./controller/socketController.js";
import libraryRoute from "./router/library/libraryRoute.js"


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
app.use("/api/library-student", authMiddleware, libStudentRoutes)
app.use("/api/library", authMiddleware, libraryRoute)


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
  await registerNewConnection(ws);

  ws.on('message', async (message) => {

    try {
      const data = JSON.parse(message);

      switch (data.event) {
        // General
        case 'direct_message':
          console.log(`DM from ${ws.user.id}: ${JSON.stringify(data)}`);
          await socketDM({ recipientId: data.recipientId, message: data.message, socket: ws, wss: wss });
          break;

        // Jacks
        case "addlog":
          await addAttendantLog({ data: data, developer_id: ws.user.developer_id, socket: ws, wss: wss })
          console.log(data)
          break;

        case "register":
          console.log(data)
          await registerStudentfinerPrint({  message: data.message, socket: ws, wss: wss })
          break;


        // TODO test the Tope's connection and data exchange
        // TOPE
        // its only the admin that create message thus socket wont have developer_id rather just usere.id
        case "createNewNotice":
          createNewNotification({ developerId: ws.user.id, payload })
          break;

        case "readNotice":
          ReadNotification({ socket: ws, wss: wss })
          break;

        case "sync":
          synchroniseAllDevices({ ws: ws, wss: wss })
          break;


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
