const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const iotRoutes = require("./router/iot_Routes.js")
const authRoutes = require("./router/authRoutes.js")
const { pool, } = require('./db/config');
const { socketDM, socketDisconect, registerNewConnection, socketRetreiveTodaysAttendance, addAttendantLog, socketAuthMiddleware } = require("./socket/socketController.js");
const socketManager = require("./utils/socket_manager.js")


const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
   transports: ["websocket"], // Force WebSocket only
  allowEIO3: true, // Enable v2/v3 compatibility
  path: "/socket.io"
});
socketManager.init(io)
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true, }));
app.use(cors());
app.use(express.static('public'));

app.use((req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',').shift() || 
    req.socket?.remoteAddress;
    
  console.log(`Incoming request from IP: ${ip}`);
  next();
})


io.use(socketAuthMiddleware);
io.on('connection', (socket) => {
  registerNewConnection(socket)
  // Send direct message
  socket.on('direct-message', ({ recipientId, message }) => socketDM(recipientId, message, socket));
  // Send attendance data
  socket.on('attendance-data', ({ deviceId }) => socketRetreiveTodaysAttendance({ deviceId: deviceId, userId: socket.user.id }));
  socket.on('add_attendance_log', (data) => addAttendantLog({ deviceId: socket.user.id, data: data }));


  // Handle disconnection
  socket.on('disconnect', _ => socketDisconect(socket));

});





// Routes
app.use('/api/iot', iotRoutes);
app.use("/api/auth", authRoutes)
app.get('/', (req, res) => res.json({ message: 'Welcome to the Home Assistant API' }));
// Store connected clients and their types


const PORT = process.env.PORT || 3000;
async function startApp() {
  try {

    // Run migrations

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
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