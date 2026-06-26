/**
 * Socket.io handlers for multiplayer rooms.
 */

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = function setupRoomHandler(io) {
  const rooms = io.of('/rooms');

  rooms.on('connection', (socket) => {
    console.log(`User connected to /rooms: ${socket.id}`);
    
    let currentRoom = null;

    socket.on('create-room', (callback) => {
      if (currentRoom) {
        socket.leave(currentRoom);
      }
      
      const code = generateRoomCode();
      currentRoom = code;
      socket.join(code);
      
      console.log(`Room created: ${code}`);
      
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: code });
      }
      
      // Update users count in room
      emitRoomState(rooms, code);
    });

    socket.on('join-room', (code, callback) => {
      const roomStr = String(code).toUpperCase();
      
      if (currentRoom) {
        socket.leave(currentRoom);
        emitRoomState(rooms, currentRoom);
      }
      
      currentRoom = roomStr;
      socket.join(roomStr);
      
      console.log(`User ${socket.id} joined room: ${roomStr}`);
      
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: roomStr });
      }
      
      emitRoomState(rooms, roomStr);
    });

    socket.on('leave-room', (callback) => {
      if (currentRoom) {
        socket.leave(currentRoom);
        emitRoomState(rooms, currentRoom);
        currentRoom = null;
      }
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // Firecracker event broadcasting
    socket.on('light-cracker', (data) => {
      if (!currentRoom) return; // Ignore if not in a room
      
      // Broadcast to everyone ELSE in the room
      socket.to(currentRoom).emit('remote-cracker', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (currentRoom) {
        emitRoomState(rooms, currentRoom);
      }
    });
  });
};

function emitRoomState(namespace, roomCode) {
  const room = namespace.adapter.rooms.get(roomCode);
  const count = room ? room.size : 0;
  namespace.to(roomCode).emit('room-state', { users: count });
}
