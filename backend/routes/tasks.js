const express = require('express');
const { 
    getTasks, 
    createTask, 
    updateTask, 
    deleteTask 
} = require('../controllers/tasks');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All task routes below this are protected by the 'protect' middleware
router.use(protect);

// Routes for getting all tasks for a project and creating a new task
router.route('/')
  .get(getTasks)
  .post(createTask);

// Routes for updating and deleting a specific task by its ID
router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

module.exports = router;

