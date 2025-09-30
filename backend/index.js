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

// --- START: UNIFIED CORS CONFIGURATION FIX ---
const allowedOrigins = [
    'http://localhost:3000', // Your local frontend
    process.env.FRONTEND_URL  // Your deployed frontend on Vercel
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true
};

// Apply the unified CORS options to the entire app
app.use(cors(corsOptions));
// --- END: UNIFIED CORS CONFIGURATION FIX ---

app.use(express.json());

// Mount API routers
app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/tasks', tasks);
app.use('/api/ai', ai);
app.use('/api/chat', chat);

// --- Socket.io Integration ---
const server = http.createServer(app);
// Pass the SAME corsOptions to Socket.io
const io = new Server(server, {
    cors: corsOptions
});

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);
    // ... (rest of your socket.io logic remains the same)
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
// --- End Socket.io Integration ---

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});