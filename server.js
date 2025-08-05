const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  
  const io = socketIo(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store active rooms and users
  const rooms = new Map();
  const users = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join-room', (data) => {
      const { roomId, userName, userType } = data;
      
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userName = userName;
      socket.userType = userType;
      
      // Store user info
      users.set(socket.id, { roomId, userName, userType });
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      
      // Add user to room
      rooms.get(roomId).add(socket.id);
      
      console.log(`${userName} (${userType}) joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName,
        userType
      });
      
      // Send current room users to the new user
      const roomUsers = Array.from(rooms.get(roomId))
        .filter(id => id !== socket.id)
        .map(id => {
          const user = users.get(id);
          return user ? { userId: id, userName: user.userName, userType: user.userType } : null;
        })
        .filter(Boolean);
      
      socket.emit('room-users', roomUsers);
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      const user = users.get(socket.id);
      if (user && user.roomId) {
        const room = rooms.get(user.roomId);
        if (room) {
          room.delete(socket.id);
          
          // Notify others in the room
          socket.to(user.roomId).emit('user-left', {
            userId: socket.id,
            userName: user.userName
          });
          
          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(user.roomId);
          }
        }
      }
      
      users.delete(socket.id);
    });

    // Leave room manually
    socket.on('leave-room', () => {
      const user = users.get(socket.id);
      if (user && user.roomId) {
        socket.leave(user.roomId);
        
        const room = rooms.get(user.roomId);
        if (room) {
          room.delete(socket.id);
          
          // Notify others in the room
          socket.to(user.roomId).emit('user-left', {
            userId: socket.id,
            userName: user.userName
          });
          
          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(user.roomId);
          }
        }
      }
    });
  });

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log('> Socket.io server is running');
  });
});
