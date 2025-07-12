let ioInstance = null;

module.exports = {
  init: (io) => {
    ioInstance = io;
  },
  getIO: () => {
    if (!ioInstance) {
      throw new Error('Socket.IO instance not initialized!');
    }
    return ioInstance
  }
};