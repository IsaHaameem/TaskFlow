const express = require('express');
const { summarizeTask } = require('../controllers/ai');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All AI routes are protected
router.use(protect);

router.route('/summarize').post(summarizeTask);

module.exports = router;

