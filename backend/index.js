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

// --- START: SIMPLIFIED CORS DEBUGGING FIX ---
// We are temporarily removing the complex configuration and using the simplest possible one.
// This allows all origins and all methods.
app.use(cors());
// --- END: SIMPLIFIED CORS DEBUGGING FIX ---

app.use(express.json());

// Mount API routers
app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/ai', ai);
app.use('/api/chat', chat);

const server = http.createServer(app);
const io = new Server(server, {
    // Also simplify the Socket.io CORS to match
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set('socketio', io);

// ... (rest of your socket.io logic remains the same)
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