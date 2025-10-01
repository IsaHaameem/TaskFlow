const http = require('http');
const { Server } = require("socket.io");
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Import Models ---
const Message = require('./models/Message');
const User = require('./models/User'); // Import User model to populate sender details

// Load environment variables and connect to DB
dotenv.config();
connectDB();

// --- Import Route files ---
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();
app.use(cors());
app.use(express.json());

// --- Mount routers ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health', healthRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);

    socket.on('joinProject', (projectId) => {
        socket.join(projectId);
    });

    socket.on('sendMessage', async ({ projectId, content, senderId }) => {
        try {
            // Create and save the new message
            const message = new Message({
                content,
                sender: senderId,
                project: projectId,
            });
            await message.save();

            // --- FIX: Populate sender details before broadcasting ---
            // This adds the sender's name and email to the message object
            const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');

            // Broadcast the complete message object
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
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

