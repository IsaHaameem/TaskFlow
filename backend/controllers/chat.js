const Message = require('../models/Message');
const Project = require('../models/Project');

// Helper function to check for project membership
const checkProjectMembership = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    return project.members.some(member => member.user.equals(userId));
};

// @desc    Get all messages for a project
// @route   GET /api/chat?projectId=:projectId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        
        // Security check: Only members can get messages (from your new code)
        const isMember = await checkProjectMembership(projectId, req.user.id);
        if (!isMember) {
            return res.status(403).json({ success: false, msg: 'Not authorized to view these messages' });
        }

        // --- FIX: Ensure sender's name and email are always included ---
        const messages = await Message.find({ project: projectId })
            .populate('sender', 'name email') // This is the crucial fix
            .sort({ createdAt: 1 }); // Sort by oldest first

        res.status(200).json({ success: true, data: messages });

    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

