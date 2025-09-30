const http = require('http');
const { Server } = require("socket.io");
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Import Models ---
const Message = require('./models/Message');

// Load environment variables and connect to DB
dotenv.config();
connectDB();

// --- Import Route files ---
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health'); // <-- 1. IMPORT THE NEW ROUTE

const app = express();

// Use the simplified CORS for debugging
app.use(cors());

app.use(express.json());

// --- Mount routers ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes); // <-- 2. USE THE NEW ROUTE

// --- Socket.io Integration ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Keep this open for debugging
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set('socketio', io);

// ... (rest of your socket.io logic)
io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);

    socket.on('joinProject', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project room ${projectId}`);
    });

    socket.on('sendMessage', async ({ projectId, content, senderId }) => {
        try {
            const message = new Message({
                content,
                sender: senderId,
                project: projectId,
            });
            await message.save();
            const populatedMessage = await Message.findById(message._id).populate('sender', 'username email');
            io.to(projectId).emit('newMessage', populatedMessage);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

