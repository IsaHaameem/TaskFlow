const express = require('express');
const { getMessages } = require('../controllers/chat');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All chat routes are protected
router.use(protect);

router.route('/').get(getMessages);

module.exports = router;
