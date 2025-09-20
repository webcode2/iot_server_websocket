import jwt from 'jsonwebtoken';
import { getUserDevices } from "./deviceController.js";
import { getMessage, setMessage } from "./messageController.js";
import credentials from "../config/credentials.js";

// Track online users/devices and connections
let onlineUsers = new Set();
let onlineDevices = new Set();
const connections = new Map(); // userId → Set of ws connections

// Helper to send JSON
function sendJSON(ws, event, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

const loadDevices = async ({ ws }) => {
  const userId = ws.user.id;
  const userDevices = await getUserDevices({ developer_id: userId });
  const userOnlineDevices = userDevices.filter(device => onlineDevices.has(device.id));

  if (connections.has(userId)) {
    connections.get(userId).forEach(client => {
      sendJSON(client, "SERVER_EVENT", {
        sender: "SERVER",
        devices: userOnlineDevices,
        timestamp: new Date()
      });
    });
  }
};

const notifyApp = async ({ developer_id, ws }) => {
  if (!developer_id || !ws) return;
  if (connections.has(developer_id)) {
    connections.get(developer_id).forEach(client => {
      sendJSON(client, "SERVER_EVENT", {
        sender: "SERVER",
        devices: { ...ws.user },
        timestamp: new Date()
      });
    });
  }
};

// Notify developer when a device goes offline
const notifyDeviceDisconnect = async ({ developer_id, device_id }) => {
  if (!developer_id || !device_id) return;
  if (connections.has(developer_id)) {
    connections.get(developer_id).forEach(client => {


      sendJSON(client, "SERVER_EVENT", {
        sender: "SERVER",
        event: "device_offline",
        device_id,
        timestamp: new Date()
      });
    });
  }
};

export const socketAuthMiddleware = async (data, ws, req) => {
  // expects data = { token }
  const token = data?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, credentials.app_secret);
    console.log(decoded)
    return {
      name: decoded.account_name,
      id: decoded.account_id,
      account_type: decoded.account_type,
      developer_id: decoded.developer_id
    };
  } catch (e) {
    return null;
  }
};

export const registerNewConnection = async (ws) => {
  const userId = ws.user.id;
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(ws);

  if (ws.user.account_type === "developer") {
    onlineUsers.add(userId);
    await loadDevices({ ws });
  } else {
    onlineDevices.add(userId);
    await notifyApp({ developer_id: ws.user.developer_id, ws });
  }
};



export const getDeviceStatus = ({ ws, user, devices = [] }) => {

  const new_state = devices.map((deviceId) => {
    return { status: connections.has(deviceId), deviceId: deviceId }
  })
  senddeJSON(ws, "heart_beat", new_state)
}


export const socketDisconect = async (ws) => {
  if (!ws.user) return;
  const userId = ws.user.id;
  onlineUsers.delete(userId);
  onlineDevices.delete(userId);
  if (connections.has(userId)) {
    connections.get(userId).delete(ws);
    if (connections.get(userId).size === 0) {
      connections.delete(userId);
      // If this is a device, notify its developer
      if (ws.user.account_type === "device" && ws.user.developer_id) {
        await notifyDeviceDisconnect({ developer_id: ws.user.developer_id, device_id: userId });
      }
    }
  }
};

// Direct message: send to recipient if online
export const socketDM = ({ recipientId, message, ws, clients, event = "direct_message" }) => {
  let found = false;
  clients.forEach((user, clientWs) => {
    if (
      clientWs.readyState === clientWs.OPEN &&
      clientWs.user &&
      clientWs.user.id === recipientId
    ) {
      sendJSON(clientWs, event, {
        sender: {
          id: ws.user.id,
          name: ws.user.name
        },
        message,
        timestamp: Date.now()
      });
      found = true;
    }
  });

  if (!found) {
    sendJSON(ws, "direct_message_error", {
      message: `Recipient ${recipientId} is not online.`,
      recipientId
    });
  }
};



export const ReadNotification = async ({ developerId, userId, ws }) => {
  const data = await getMessage({ developer_id: developerId });
  console.log(data)
  if (!data) {
    sendJSON(ws, "read_messages", {
      sender: "SERVER",
      data: "No messages found."
    });
    return;
  }
  sendJSON(ws, "read_messages", {
    sender: "SERVER",
    data
  });

  socketDM({
    recipientId: developerId,
    message: { event: "SERVER_EVENT", data: "Your device just read from the database" },
    ws,
    clients: connections
  });
};

