require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const setupRoomHandler = require('./sockets/roomHandler');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup socket namespaces
setupRoomHandler(io);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`FireCracker backend running on port ${PORT}`);
});
