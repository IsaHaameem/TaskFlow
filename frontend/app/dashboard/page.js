'use client';

import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Modal from '../../components/Modal';

// --- (SVG Icons remain the same) ---
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const ProjectCard = ({ project, onEdit, onDelete }) => {
    // ... (ProjectCard component remains the same)
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div className="bg-white rounded-lg shadow p-6 relative group transition-shadow hover:shadow-md">
            <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
            <p className="mt-2 text-sm text-gray-600 h-10 overflow-hidden">{project.description}</p>
            <div className="mt-4 border-t pt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                <Link href={`/project/${project._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View Project
                </Link>
            </div>
            <div className="absolute top-4 right-4">
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <OptionsIcon />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <button onClick={() => { setMenuOpen(false); onEdit(project); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <EditIcon /> Edit
                        </button>
                        <button onClick={() => { setMenuOpen(false); onDelete(project); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user, token, logoutAction } = useAuth();
    const [projects, setProjects] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectData, setProjectData] = useState({ name: '', description: '' });
    const [formError, setFormError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    // FIX #1: Wrapped fetchProjects in useCallback
    const fetchProjects = useCallback(async () => {
        if (token) {
            setIsFetching(true);
            setFetchError(null);
            try {
                const res = await fetch('http://localhost:5001/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch projects.');
                const data = await res.json();
                if (data.success) setProjects(data.data);
                else throw new Error(data.msg || 'An error occurred.');
            } catch (error) {
                setFetchError(error.message);
            } finally {
                setIsFetching(false);
            }
        } else {
            setIsFetching(false);
        }
    }, [token]);

    // FIX #2: Added fetchProjects to the dependency array
    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user, fetchProjects]);

    // ... (other handlers like handleLogout, handleFormChange, etc. remain the same)
    const handleLogout = () => {
        logoutAction();
    };
    const handleFormChange = (e) => {
        setProjectData({ ...projectData, [e.target.name]: e.target.value });
    };
    const handleOpenCreateModal = () => {
        setEditingProject(null);
        setProjectData({ name: '', description: '' });
        setIsEditModalOpen(true);
    };
    const handleOpenEditModal = (project) => {
        setEditingProject(project);
        setProjectData({ name: project.name, description: project.description });
        setIsEditModalOpen(true);
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (editingProject) {
            await handleUpdateProject();
        } else {
            await handleCreateProject();
        }
    };
    const handleCreateProject = async () => {
        if (!projectData.name.trim()) { setFormError('Project name is required.'); return; }
        setFormError('');
        try {
            const res = await fetch('http://localhost:5001/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(projectData),
            });
            const data = await res.json();
            if (data.success) {
                setIsEditModalOpen(false);
                await fetchProjects();
            } else {
                setFormError(data.msg || 'Failed to create project.');
            }
        } catch (error) {
            setFormError('An error occurred.');
        }
    };
    const handleUpdateProject = async () => {
        if (!projectData.name.trim()) { setFormError('Project name is required.'); return; }
        setFormError('');
        try {
            const res = await fetch(`http://localhost:5001/api/projects/${editingProject._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(projectData)
            });
            const data = await res.json();
            if (data.success) {
                setIsEditModalOpen(false);
                setEditingProject(null);
                await fetchProjects();
            } else {
                setFormError(data.msg || 'Failed to update project.');
            }
        } catch (error) {
            setFormError('An error occurred.');
        }
    };
    const handleOpenDeleteModal = (project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };
    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        try {
            await fetch(`http://localhost:5001/api/projects/${projectToDelete._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
            await fetchProjects();
        } catch (error) {
            setFetchError('Failed to delete project. Please try again.');
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-100">
                {/* ... (header and main content structure remains the same) ... */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">TaskFlow Dashboard</h1>
                        <button onClick={handleLogout} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Logout</button>
                    </div>
                </header>
                <main>
                    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
                            <button onClick={handleOpenCreateModal} className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">+ Create New Project</button>
                        </div>
                        {isFetching ? <p>Loading projects...</p> : fetchError ? <p className="text-red-500">Error: {fetchError}</p> : projects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <ProjectCard key={project._id} project={project} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center bg-white p-12 rounded-lg shadow">
                                <h3>No projects yet!</h3>
                                <p>Get started by creating your first project.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={editingProject ? 'Edit Project' : 'Create a New Project'}>
                {/* ... (Edit/Create Modal form remains the same) ... */}
                <form onSubmit={handleFormSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input type="text" name="name" id="name" value={projectData.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500" required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" rows="3" value={projectData.description} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"></textarea>
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{editingProject ? 'Update Project' : 'Create Project'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                {projectToDelete && (
                    <div>
                        <p className="text-sm text-gray-600">
                            {/* FIX #3: Replaced " with &quot; */}
                            Are you sure you want to delete the project <span className="font-bold">&quot;{projectToDelete.name}&quot;</span>?
                            This will permanently delete the project and all of its tasks. This action cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="py-2 px-4 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConfirmDelete} className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                                Delete Project
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
