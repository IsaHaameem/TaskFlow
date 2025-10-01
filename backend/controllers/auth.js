const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- Error Handler Utility ---
// A simple utility to provide better error messages from Mongoose
const getErrorMessage = (err) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return `An account with that ${field} already exists.`;
    }
    if (err.name === 'ValidationError') {
        return Object.values(err.errors).map(val => val.message).join(', ');
    }
    return 'An unexpected error occurred.';
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    // --- FIX: Destructure 'username' to match the frontend and User model ---
    const { username, email, password } = req.body;

    try {
        const user = await User.create({
            username,
            email,
            password,
        });

        // Send a token upon successful registration
        sendTokenResponse(user, 201, res);

    } catch (err) {
        const message = getErrorMessage(err);
        // This will now send a specific error (e.g., "User already exists") instead of crashing
        res.status(400).json({ success: false, message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    try {
        // Find user by email, and explicitly include the password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// --- Helper function to sign JWT and send response ---
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    res.status(statusCode).json({
        success: true,
        token,
    });
};

