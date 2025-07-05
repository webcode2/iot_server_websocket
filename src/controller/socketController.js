
import jwt from 'jsonwebtoken';
import { addNewAttendance } from "./libraryController.js";
import { getUserDevices } from "./deviceController.js";
import { getMessage, setMessage } from "./messageController.js";

let onlineUsers = new Set();
let onlineDevices = new Set()
const connections = new Map(); // userId → Set of ws connections


const loadDevices = async ({ ws }) => {
  const userId = ws.user.id;
  const userDevices = await getUserDevices({ developer_id: userId });
  const userOnlineDevices = userDevices.filter(device => onlineDevices.has(device.id));

  if (connections.has(userId)) {
    connections.get(userId).forEach(client => {
      client.send(JSON.stringify({
        type: "SERVER_EVENT",
        sender: "SERVER",
        devices: userOnlineDevices,
        timestamp: new Date()
      }));
    });
  }
};

const notifyApp = async ({ developer_id, ws }) => {
  if (!developer_id) throw new Error("developer_id required");
  if (!ws) throw new Error("ws instance required");

  if (connections.has(developer_id)) {
    connections.get(developer_id).forEach(client => {
      client.send(JSON.stringify({
        type: "SERVER_EVENT",
        sender: "SERVER",
        devices: { ...ws.user },
        timestamp: new Date()
      }));
    });
  }
};





export const socketAuthMiddleware = async (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return resolve(null);
    }
    jwt.verify(token, credentials.app_secret, (err, decoded) => {
      if (err || !decoded) return resolve(null);

      const user = {
        name: decoded.account_name,
        id: decoded.account_id,
        account_type: decoded.account_type,
        developer_id: decoded.account_type === "device" ? decoded.developer_id : undefined
      };
      resolve(user);
    });
  });
}


export const registerNewConnection = async (ws) => {
  const userId = ws.user.id;

  // Add connection to map
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(ws);

  // Track type
  if (ws.user.account_type === "developer") {
    onlineUsers.add(userId);
    await loadDevices({ ws });
  } else {
    onlineDevices.add(userId);
    await notifyApp({ developer_id: ws.user.developer_id, ws });
  }
  return
};

export const socketDisconect = async (socket,) => {
  // console.log(`Client disconnected: ${socket.id}`);
  onlineUsers.delete(socket.user.id);

}


export const socketDM = async ({ recipientId, message, socket, wss }) => {
  if (!recipientId) {
    console.error('Recipient ID is required');
    return;
  }

  let found = false;

  wss.clients.forEach(client => {
    // Check:
    // 1. client is alive and ready
    // 2. client has a user ID
    if (
      client.readyState === 1 &&
      client.user &&
      client.user.id === recipientId
    ) {
      client.send(JSON.stringify({
        event: 'direct_message',
        sender: {
          id: socket.user.id,
          name: socket.user.name
        },
        message,
        timestamp: new Date()
      }));

      found = true;
    }
  });

  if (!found) {
    console.error(`Recipient ${recipientId} not online`);
  }
};


// JAcks Library


export const addAttendantLog = async ({ data, developer_id, socket, wss }) => {
  const atten = await addNewAttendance(data);

  if (atten) {
    await socketDM({ recipientId: developer_id, message: { ...atten }, socket: socket, wss: wss });
  }
};









// TOPE Notice Boaard

export const createNewNotification = async ({ payload, developerId, socket, wss }) => {
  const { duration, message } = payload;
  const data = await setMessage({
    developer_id: developerId,
    duration,
    message
  });

  await socketDM({ recipientId: developerId, message: { type: "SERVER_EVENT", data }, socket: socket, wss: wss });
};

// get called when the board reads data
export const ReadNotification = async ({ socket, wss }) => {
  const data = await getMessage({ developer_id: ws.user.developer_id });

  await socketDM({ recipientId: userId, message: { event: "SERVER_EVENT", data }, socket: socket, wss: wss });
  await socketDM({ recipientId: ws.user.developer_id, message: { event: "SERVER_EVENT", data: "Your device just read from the database" }, socket: socket, wss: wss });
};

export const synchroniseAllDevices = async ({ ws, wss }) => {
  const devices = await getUserDevices({ deceloper_id: ws.user.id })
  devices.forEach(device => {
    socketDM({ recipientId: device.id, message: { action: "sync", }, socket: ws, wss: wss })
  })

}


