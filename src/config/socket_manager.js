// socket_manager.js
let ioInstance = null;

const init = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized!');
  }
  return ioInstance;
};

export default {
  init,
  getIO,
};
