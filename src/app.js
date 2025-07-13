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
  registerStudentfinerPrintRFID,
  PromptUserForIdFromDevice,
  retrieveStudentBorrowedBooks,
  getStudentByFingerPrintId,
} from './controller/socketController.js';
import authRoutes from './router/authRoutes.js'; // 
import iotRoutes from './router/iot_Routes.js'; // 
import libStudentRoutes from "./router/library/studentRoute.js"
import { socketDM } from "./controller/socketController.js";
import { authMiddleware } from "./config/authMiddleware.js";
import libraryRoute from "./router/library/libraryRoute.js"
import libraryBooksRoute from "./router/library/booksRoute.js"


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
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const method = req.method;

  // console.log(`Incoming request | IP: ${ip} | Method: ${method} | URL: ${fullUrl}`);

  next();
});



// === REST ROUTES ===
app.use('/api/iot', authMiddleware, iotRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/library-student", authMiddleware, libStudentRoutes)
app.use("/api/library", authMiddleware, libraryRoute)
app.use("/api/library-books", libraryBooksRoute)


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
          await socketDM({ recipientId: data.recipientId, message: data.message, socket: ws, wss: wss });
          break;

        // Jacks

        // triger by admin
        case "register":
          await registerStudentfinerPrintRFID({ socket: ws, wss: wss, rfid: data.method.toLowerCase() === "rfid" })
          break;
        // Fired by admin
        case "promptUser":
          await PromptUserForIdFromDevice({ socket: ws, wss: wss, rfid: data.method.toLowerCase() === "rfid" })
          break;


        // trigger by microtroller
        // add attendace log
        case "addlog":
          await addAttendantLog({ data: data, developer_id: ws.user.developer_id, socket: ws, wss: wss })
          break;

        // to find student owed books  using their fingerprint id
        case "retrieveStudentBorrowedBooks":
          await retrieveStudentBorrowedBooks({ recipientId: data.recipientId, socket: ws, accessId: data.accessId, wss: wss, rfid: data.method?.toLowerCase() === "rfid" })
          break;
        //  to register student We only need student details
        case "retrieveUserAndSendToAdmin":
          await getStudentByFingerPrintId({ accessId: data.accessId, recipientId: data.recipientId, socket: ws, wss })
          break

        default:
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
