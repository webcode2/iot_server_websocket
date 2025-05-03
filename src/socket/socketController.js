const { getTodayLogs, addNewLog, getUserDevices } = require("../controller/deviceController");
const { db } = require("../db/config");
const jwt = require('jsonwebtoken');
const socket_manager = require("../utils/socket_manager");
const credentials = require("../utils/credentials");
const { iotDevices } = require("../db/schema");
const { timestamp } = require("drizzle-orm/gel-core");

let onlineUsers = new Set();
let onlineDevices = new Set()

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
    console.log(decoded)
    socket.user = {
      name: decoded.account_name,
      id: decoded.account_id,
      account_type: decoded.account_type,
      developer_id: decoded.account_type === "device" ? decoded.developer_id : undefined
    }; // Add user data to socket object
    next();
  })
}


const loadDevices = async ({ socket }) => {
  if (!socket) throw new Error("user socket is required to figure out the developer")
  const io = socket_manager.getIO()
  let user_devices = [...await getUserDevices({ developer_id: socket.user.id })]
  let user_onlineDevices = user_devices.filter(device => onlineDevices.has(device.id))
  io.to(`user_${socket.user.id}`).emit("SERVER_EVENT", {
    sender: "SERVER",
    devices: user_onlineDevices,
    timestamp: new Date()
  })
}


const notifyApp = async ({ developer_id, socket = undefined }) => {
  if (!developer_id) throw new Error("developer is required to figure out the developer")
  const io = socket_manager.getIO()
  if (!socket) throw new Error("Socket instance not specified")
  onlineUsers.has(developer_id) ? io.to(`user_${developer_id}`).emit("SERVER_EVENT", {
    sender: "SERVER",
    devices: { ...socket.user },
    timestamp: new Date()
  }) : null
}







const registerNewConnection = async (socket) => {
  socket.join(`user_${socket.user.id}`);
  socket.user.account_type == "developer" ? onlineUsers.add(socket.user.id) : onlineDevices.add(socket.user.id)
  socket.user.account_type === "developer" ? loadDevices({ socket: socket }) : notifyApp({ developer_id: socket.user.developer_id, socket: socket })
}


const socketDM = async (recipientId, message, socket) => {
  const io = socket_manager.getIO();

  // Verify recipient exists and is allowed to receive messages
  if (!recipientId) {
    console.error('Recipient ID is required');
    return;
  }
  if (!onlineUsers.has(recipientId) && !onlineDevices.has(recipientId)) {
    console.error('Recipient is not online');
    return;
  }
  console.log(socket.user)
  io.to(`user_${recipientId}`).emit('direct_message', {
    sender: {
      id: socket.user.id,
      name: socket.user.name
    },
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