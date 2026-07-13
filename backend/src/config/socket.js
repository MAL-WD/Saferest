// src/config/socket.js
// Socket.io server factory — attached to the HTTP server in server.js.
// Returns the initialized io instance for use in other modules (e.g. workers emitting events).

const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client joins a room for a specific scan
    socket.on('join:scan', (scanId) => {
      socket.join(`scan:${scanId}`);
      logger.debug(`Socket ${socket.id} joined room scan:${scanId}`);
    });

    socket.on('leave:scan', (scanId) => {
      socket.leave(`scan:${scanId}`);
    });

    socket.on('join:pcap', (scanId) => {
      socket.join(`pcap:${scanId}`);
      logger.debug(`Socket ${socket.id} joined room pcap:${scanId}`);
    });

    socket.on('leave:pcap', (scanId) => {
      socket.leave(`pcap:${scanId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info(' Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
  return io;
};

module.exports = { initSocket, getIO };
