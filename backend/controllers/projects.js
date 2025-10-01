const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all projects a user is a member of
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        // --- FIX: Added .populate('members.user', 'name email') to fetch member details ---
        const projects = await Project.find({ 'members.user': req.user.id })
            .populate('owner', 'name email')
            .populate('members.user', 'name email');

        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('owner', 'name email').populate('members.user', 'name email');

        if (!project || !project.members.some(member => member.user._id.equals(req.user.id))) {
            return res.status(404).json({ success: false, message: 'Project not found or you are not a member' });
        }
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
    try {
        req.body.owner = req.user.id;
        req.body.members = [{ user: req.user.id, role: 'admin' }];

        const project = await Project.create(req.body);
        const populatedProject = await Project.findById(project._id).populate('owner', 'name email').populate('members.user', 'name email');
        res.status(201).json({ success: true, data: populatedProject });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const member = project.members.find(m => m.user.equals(req.user.id));
        if (!member || member.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }
        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('members.user', 'name email');
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project || project.owner.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Project not found or not authorized' });
        }
        await Task.deleteMany({ project: req.params.id });
        await project.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add a member to a project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addProjectMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const isAdmin = project.members.some(member => member.user.equals(req.user.id) && member.role === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to add members' });
        }
        const { email } = req.body;
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ success: false, message: `User with email ${email} not found` });
        }
        if (project.members.some(member => member.user.equals(userToInvite._id))) {
            return res.status(400).json({ success: false, message: 'User is already a member' });
        }
        project.members.push({ user: userToInvite._id, role: 'member' });
        await project.save();
        const updatedProject = await Project.findById(req.params.id).populate('members.user', 'name email');
        res.status(200).json({ success: true, data: updatedProject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
exports.removeProjectMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const isAdmin = project.members.some(member => member.user.equals(req.user.id) && member.role === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to remove members' });
        }
        const memberIdToRemove = req.params.memberId;
        if (project.owner.equals(memberIdToRemove)) {
            return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
        }
        project.members = project.members.filter(member => !member.user.equals(memberIdToRemove));
        await project.save();
        const updatedProject = await Project.findById(req.params.id).populate('members.user', 'name email');
        res.status(200).json({ success: true, data: updatedProject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a member's role in a project
// @route   PUT /api/projects/:id/members/:memberId
// @access  Private
exports.updateMemberRole = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        const isAdmin = project.members.some(member => member.user.equals(req.user.id) && member.role === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to change roles' });
        }
        const memberIdToUpdate = req.params.memberId;
        const memberToUpdate = project.members.find(member => member.user.equals(memberIdToUpdate));
        if (!memberToUpdate) {
            return res.status(404).json({ success: false, message: 'Member not found in this project' });
        }
        if (project.owner.equals(memberIdToUpdate)) {
            return res.status(400).json({ success: false, message: 'Cannot change the project owner\'s role' });
        }
        memberToUpdate.role = req.body.role;
        await project.save();
        const updatedProject = await Project.findById(req.params.id).populate('members.user', 'name email');
        res.status(200).json({ success: true, data: updatedProject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

