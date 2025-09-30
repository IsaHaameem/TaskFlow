const Task = require('../models/Task');
const Project = require('../models/Project');

// A helper function to check if a user is a member of a project
const checkProjectMembership = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    return project.members.some(member => member.user.equals(userId));
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const projectId = req.query.projectId;
    // Security check: Ensure the user is a member of the project
    const isMember = await checkProjectMembership(projectId, req.user.id);
    if (!isMember) {
        return res.status(403).json({ success: false, msg: 'You are not a member of this project' });
    }

    // --- UPDATED: Populate the assignee's name and email ---
    const tasks = await Task.find({ project: projectId }).populate('assignee', 'name email');
    
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const io = req.app.get('socketio');
    const projectId = req.body.project;

    const isMember = await checkProjectMembership(projectId, req.user.id);
    if (!isMember) {
        return res.status(403).json({ success: false, msg: 'You are not authorized to add tasks to this project' });
    }
    
    req.body.user = req.user.id; // Assign the creator
    const task = await Task.create(req.body);
    
    // We need to populate the assignee before emitting the event
    const populatedTask = await Task.findById(task._id).populate('assignee', 'name email');

    io.to(projectId.toString()).emit('taskCreated', populatedTask);
    res.status(201).json({ success: true, data: populatedTask });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, msg: 'Task not found' });
        }

        const isMember = await checkProjectMembership(task.project, req.user.id);
        if (!isMember) {
            return res.status(403).json({ success: false, msg: 'Not authorized to update this task' });
        }

        task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('assignee', 'name email');
        io.to(task.project.toString()).emit('taskUpdated', task);
        res.status(200).json({ success: true, data: task });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, msg: 'Task not found' });
        }

        const isMember = await checkProjectMembership(task.project, req.user.id);
        if (!isMember) {
            return res.status(403).json({ success: false, msg: 'Not authorized to delete this task' });
        }
        
        const projectId = task.project.toString();
        await task.deleteOne();

        io.to(projectId).emit('taskDeleted', req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

