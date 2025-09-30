const express = require('express');
const { 
    getProjects, 
    getProject, 
    createProject, 
    updateProject,
    deleteProject,
    addProjectMember,
    removeProjectMember, // <-- Import removeProjectMember
    updateMemberRole    // <-- Import updateMemberRole
} = require('../controllers/projects');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes below this will be protected
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
    .route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

// Route for adding a new member
router.route('/:id/members').post(addProjectMember);

// Routes for managing a specific member (update role or remove)
router.route('/:id/members/:memberId')
    .put(updateMemberRole)
    .delete(removeProjectMember);

module.exports = router;

