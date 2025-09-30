const http = require('http');
const { Server } = require("socket.io");
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Import Models for Socket.io ---
const Message = require('./models/Message');

// Load environment variables and connect to DB
dotenv.config();
connectDB();

// Route files
const auth = require('./routes/auth');
const projects = require('./routes/projects');
const tasks = require('./routes/tasks');
const ai = require('./routes/ai');
const chat = require('./routes/chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routers
app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/ai', ai);
app.use('/api/chat', chat);

// --- Socket.io Integration ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// We will pass the `io` instance to our controllers so they can emit events
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('A user connected with socket id:', socket.id);

  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project room ${projectId}`);
  });

  // --- NEW: Handle incoming chat messages ---
  socket.on('sendMessage', async ({ projectId, content, senderId }) => {
    try {
        const message = new Message({
            content,
            sender: senderId,
            project: projectId,
        });
        await message.save();

        // Populate sender details before broadcasting
        const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');

        // Broadcast the new message to everyone in the project room
        io.to(projectId).emit('newMessage', populatedMessage);
    } catch (error) {
        console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
// --- End Socket.io Integration ---


const PORT = process.env.PORT || 5000;

// Start the server by listening on the http server, not the app
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

