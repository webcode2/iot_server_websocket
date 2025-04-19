const { getTodayLogs, addNewLog } = require("../controller/deviceController");
const { db } = require("../db/config");
const jwt = require('jsonwebtoken');
const socket_manager = require("../utils/socket_manager");
const credentials = require("../utils/credentials");

let onlineUsers = new Set();
// r

async function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth.token ||               // Auth object (recommended)
    socket.handshake.query.token ||             // Query parameter
    (socket.handshake.headers.authorization &&  // Authorization header
      socket.handshake.headers.authorization.split(' ')[1]) || // Bearer token
    socket.request.cookies?.token;
  if (!token) { next(new Error("Authentication error")); return; }

  jwt.verify(token, credentials.app_secret, (err, decoded) => {
    if (err) {
      next(new Error("Authentication error"));
      return
    }
    if (!decoded) { return next(new Error("Authentication error")); }
    socket.user = { name: decoded.name, id: decoded.id }; // Add user data to socket object
    next();
  })
}








const registerNewConnection = async (socket) => {
  socket.join(`user_${socket.user.id}`);
  onlineUsers.add(socket.user.id);

}

const socketDM = async (recipientId, message, socket) => {
  const io = socket_manager.getIO();

  // Verify recipient exists and is allowed to receive messages
  if (!recipientId) {
    console.error('Recipient ID is required');
    return;
  }
  if (!onlineUsers.has(recipientId)) {
    console.error('Recipient is not online');
    return;
  }
  io.to(`user_${recipientId}`).emit('direct-message', {
    sender: socket.user.id,
    message,
    timestamp: new Date()
  });

}

const addAttendantLog = async ({ deviceId, data }) => {

  const io = socket_manager.getIO();
  let res = await addNewLog({ appId: deviceId, data: data });
  if (res) {
    io.to(`user_${deviceId}`).emit('direct-message', {
      sender: deviceId,
      message: { status: res },
      timestamp: new Date()
    });

  }
}

const socketRetreiveTodaysAttendance = async ({ deviceId = "", userId = "" }) => {
  let data = await getTodayLogs({ appId: deviceId, socket: true })
  const io = socket_manager.getIO();
  io.to(`user_${userId}`).emit('direct-message', {

    sender: deviceId,
    message: { data: { ...data.data } },
    timestamp: new Date()
  });
}


const socketDisconect = async (socket,) => {
  // console.log(`Client disconnected: ${socket.id}`);
  onlineUsers.delete(socket.user.id);

}

module.exports = {
  socketDM,
  socketDisconect,
  registerNewConnection, socketRetreiveTodaysAttendance
  , addAttendantLog, socketAuthMiddleware

}