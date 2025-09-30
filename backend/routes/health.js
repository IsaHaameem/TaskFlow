const express = require('express');
const router = express.Router();

// @desc    Check the health of the API
// @route   GET /api/health
// @access  Public
router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;
