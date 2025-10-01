'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '../../../components/Modal';
import Chat from '../../../components/chat';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import io from 'socket.io-client';

// --- Reusable SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const IceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5S8.5 5.828 8.5 5S9.172 3.5 10 3.5zM5 6.5c.828 0 1.5.672 1.5 1.5S5.828 9.5 5 9.5S3.5 8.828 3.5 8S4.172 6.5 5 6.5zm10 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5S13.5 8.828 13.5 8S14.172 6.5 15 6.5zM10 16.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5.828.672 1.5 1.5-.672 1.5-1.5 1.5z"/></svg>;


const PriorityBadge = ({ priority }) => {
    const styles = {
        High: { icon: <FireIcon />, classes: 'text-red-600 bg-red-100' },
        Medium: { icon: <ClockIcon />, classes: 'text-yellow-600 bg-yellow-100' },
        Low: { icon: <IceIcon />, classes: 'text-blue-600 bg-blue-100' },
    };
    const style = styles[priority] || styles.Medium;
    return (
        <span className={`flex items-center text-xs px-2 py-0.5 rounded-full ${style.classes}`}>
            {style.icon}
            <span className="ml-1">{priority}</span>
        </span>
    );
};

const TaskCard = ({ task, index, onDelete, onEdit, onSummarize }) => {
    const [isSummarizing, setIsSummarizing] = useState(false);
    const getInitials = (name = '') => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    const handleSummarize = async () => {
        setIsSummarizing(true);
        await onSummarize(task);
        setIsSummarizing(false);
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 group relative cursor-grab hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 pr-16">{task.title}</h4>
                        <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(task)} className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-500" aria-label="Edit task"><EditIcon /></button>
                            <button onClick={() => onDelete(task._id)} className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500" aria-label="Delete task"><TrashIcon /></button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                            <PriorityBadge priority={task.priority} />
                            {task.dueDate && <span className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                        <button onClick={() => onEdit(task)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full">
                            {task.assignee ? (
                                <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600" title={`Assigned to ${task.assignee.name}`}>
                                    {getInitials(task.assignee.name)}
                                </div>
                            ) : (
                                <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-300" title="Unassigned - Click to assign">?</div>
                            )}
                        </button>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                        <button onClick={handleSummarize} disabled={isSummarizing} className="w-full flex items-center justify-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon />
                            <span className="ml-1.5">{isSummarizing ? 'Generating...' : 'AI Summarize'}</span>
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const KanbanColumn = ({ title, tasks, onOpenModal, onDeleteTask, onEditTask, onSummarizeTask }) => {
    return (
        <div className="bg-slate-100/70 rounded-xl p-4 w-full md:w-1/3 flex-shrink-0 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">{tasks.length}</span>
            </div>
            <div className="flex-grow">
                <Droppable droppableId={title}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[200px]">
                            {tasks.map((task, index) => (
                                <TaskCard key={task._id} task={task} index={index} onDelete={onDeleteTask} onEdit={onEditTask} onSummarize={onSummarizeTask} />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
            {title === 'To Do' && (
                <button onClick={onOpenModal} className="mt-4 w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                    <PlusIcon /> Add Task
                </button>
            )}
        </div>
    );
};

export default function ProjectPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id: projectId } = params || {};

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState({ type: '', text: '' });
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // --- Kanban Board State ---
    const [tasks, setTasks] = useState([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', assignee: '' });
    const [formError, setFormError] = useState('');
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const isAdmin = useMemo(() => {
        if (!project || !user) return false;
        const currentUserInProject = project.members.find((member) => member.user?._id === user.id);
        return currentUserInProject?.role === 'admin';
    }, [project, user]);

    const fetchProject = useCallback(async () => {
        if (authLoading || !token || !projectId || !apiUrl) return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${apiUrl}/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Project not found or you do not have permission.');
            const data = await res.json();
            if (data.success) setProject(data.data);
            else throw new Error(data.msg || 'Failed to fetch project details.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authLoading, token, projectId, apiUrl]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setInviteMessage({ type: '', text: '' });
        if (!inviteEmail || !apiUrl) return;
        try {
            const res = await fetch(`${apiUrl}/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: inviteEmail }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setInviteMessage({ type: 'success', text: 'Member invited successfully! The member list will update shortly.' });
                setInviteEmail('');
                setTimeout(() => fetchProject(), 1000); // Refetch to show new member
            } else {
                setInviteMessage({ type: 'error', text: data.msg || 'Failed to invite member.' });
            }
        } catch (error) {
            setInviteMessage({ type: 'error', text: 'An error occurred.' });
        }
    };

    const handleOpenRemoveModal = (member) => {
        setMemberToRemove(member);
        setIsRemoveModalOpen(true);
    };

    const handleConfirmRemoveMember = async () => {
        if (!memberToRemove || !apiUrl) return;
        try {
            const res = await fetch(`${apiUrl}/api/projects/${projectId}/members/${memberToRemove.user._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to remove member.');
            setIsRemoveModalOpen(false);
            setMemberToRemove(null);
            await fetchProject();
        } catch (err) {
            console.error(err);
            setIsRemoveModalOpen(false);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        if(!apiUrl) return;
        try {
            const res = await fetch(`${apiUrl}/api/projects/${projectId}/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchProject();
            } else {
                throw new Error(data.msg || 'Failed to update role.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- Kanban Board Logic ---
    useEffect(() => {
        const fetchTasks = async () => {
            if (authLoading || !token || !projectId || !apiUrl) return;
            try {
                const res = await fetch(`${apiUrl}/api/tasks?projectId=${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setTasks(data.data);
            } catch (err) {
                console.error("Failed to fetch tasks", err);
            }
        };
        fetchTasks();
    }, [projectId, token, authLoading, apiUrl, project]); // Refetch tasks when project members change

    const handleTaskFormChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });
    const handleTaskFormSubmit = async (e) => {
        e.preventDefault();
        if (editingTask) await handleUpdateTask();
        else await handleAddTask();
    };

    const handleAddTask = async () => {
        if (!apiUrl || !taskData.title.trim()) return;
        try {
            const res = await fetch(`${apiUrl}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...taskData, project: projectId, status: 'To Do' }),
            });
            const data = await res.json();
            if(data.success) {
                setTasks(prev => [...prev, data.data]);
                setIsTaskModalOpen(false);
            }
        } catch(err) { console.error(err); }
    };
    const handleUpdateTask = async () => {
        if (!apiUrl || !editingTask) return;
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${editingTask._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(taskData),
            });
            const data = await res.json();
            if(data.success) {
                setTasks(prev => prev.map(t => t._id === data.data._id ? data.data : t));
                setIsTaskModalOpen(false);
            }
        } catch(err) { console.error(err); }
    };
    const handleDeleteTask = async (taskId) => {
        if (!apiUrl) return;
        try {
            await fetch(`${apiUrl}/api/tasks/${taskId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            setTasks(prev => prev.filter(t => t._id !== taskId));
        } catch (err) { console.error(err); }
    };
    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || !apiUrl) return;

        setTasks(prevTasks => {
            const task = prevTasks.find(t => t._id === draggableId);
            if(task) task.status = destination.droppableId;
            return [...prevTasks];
        });

        try {
            await fetch(`${apiUrl}/api/tasks/${draggableId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: destination.droppableId }),
            });
        } catch (error) { console.error("Failed to update task status:", error); }
    };
    const handleOpenAddTaskModal = () => {
        setEditingTask(null);
        setTaskData({ title: '', description: '', priority: 'Medium', dueDate: '', assignee: '' });
        setIsTaskModalOpen(true);
    };
    const handleOpenEditTaskModal = (task) => {
        setEditingTask(task);
        setTaskData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            assignee: task.assignee?._id || ''
        });
        setIsTaskModalOpen(true);
    };
    const handleSummarizeTask = async(task) => { /* AI logic here */ };

    if (loading || authLoading) return <div className="flex justify-center items-center min-h-screen"><p>Loading project...</p></div>;
    if (error) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-500">Error: {error}</p></div>;
    if (!project) return <div className="flex justify-center items-center min-h-screen"><p>Project not found.</p></div>;

    const columns = ['To Do', 'In Progress', 'Done'];

    return (
        <>
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm">
                     <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Back to Dashboard
                        </Link>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        <p className="mt-2 text-md text-gray-600">{project.description}</p>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Members</h2>
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="space-y-4 divide-y divide-gray-200">
                                {project.members.map(({ user: memberUser, role }) => (
                                    memberUser && (
                                        <div key={memberUser._id} className="flex items-center justify-between pt-4 first:pt-0">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {memberUser.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <p className="font-semibold text-gray-800">{memberUser.name || 'Unknown User'}</p>
                                                    <p className="text-sm text-gray-500">{memberUser.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-x-4">
                                                {isAdmin && project.owner !== memberUser._id ? (
                                                    <select value={role} onChange={(e) => handleRoleChange(memberUser._id, e.target.value)} className="text-sm font-medium text-gray-700 bg-gray-200 px-3 py-1 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                                                        <option value="member">member</option>
                                                        <option value="admin">admin</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full">{role}</span>
                                                )}
                                                {isAdmin && project.owner !== memberUser._id && (
                                                    <button onClick={() => handleOpenRemoveModal({ user: memberUser, role })} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors" aria-label={`Remove ${memberUser.name}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                            {isAdmin && (
                                <form onSubmit={handleInviteMember} className="mt-6 border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Invite New Member</h3>
                                    <div className="flex items-center mt-2 gap-4">
                                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter member's email" className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500" required />
                                        <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Invite</button>
                                    </div>
                                    {inviteMessage.text && (<p className={`mt-2 text-sm ${inviteMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{inviteMessage.text}</p>)}
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Board</h2>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-4">
                                {columns.map(status => (
                                    <KanbanColumn key={status} title={status} tasks={tasks.filter(t => t.status === status)} onOpenModal={handleOpenAddTaskModal} onDeleteTask={handleDeleteTask} onEditTask={handleOpenEditTaskModal} onSummarizeTask={handleSummarizeTask} />
                                ))}
                            </div>
                        </DragDropContext>
                    </div>
                </main>
            </div>

            <Modal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} title="Confirm Member Removal">
                 {memberToRemove && (
                    <div>
                        <p className="text-sm text-gray-600">Are you sure you want to remove <span className="font-bold">{memberToRemove.user.name}</span> from this project?</p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsRemoveModalOpen(false)} className="py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">Cancel</button>
                            <button type="button" onClick={handleConfirmRemoveMember} className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">Remove Member</button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? "Edit Task" : "Add a New Task"}>
                <form onSubmit={handleTaskFormSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
                            <input type="text" name="title" id="title" value={taskData.title} onChange={handleTaskFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500" required/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                            <textarea id="description" name="description" rows="3" value={taskData.description} onChange={handleTaskFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"></textarea>
                        </div>
                        <div>
                            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assign To</label>
                            <select id="assignee" name="assignee" value={taskData.assignee} onChange={handleTaskFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900">
                                <option value="">Unassigned</option>
                                {project?.members && project.members.map(member => (
                                    member.user && (
                                        <option key={member.user._id} value={member.user._id} className="text-gray-900">
                                            {member.user?.name || 'Unnamed User'}
                                        </option>
                                    )
                                ))}
                            </select>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                <select id="priority" name="priority" value={taskData.priority} onChange={handleTaskFormChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900">
                                    <option className="text-gray-900">Low</option>
                                    <option className="text-gray-900">Medium</option>
                                    <option className="text-gray-900">High</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" id="dueDate" name="dueDate" value={taskData.dueDate} onChange={handleTaskFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"/>
                            </div>
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsTaskModalOpen(false)} className="py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">Cancel</button>
                        <button type="submit" className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{editingTask ? 'Update Task' : 'Add Task'}</button>
                    </div>
                </form>
            </Modal>

            <div className="fixed right-6 bottom-6 z-50">
                <button onClick={() => setIsChatOpen((v) => !v)} aria-label={isChatOpen ? 'Close chat' : 'Open chat'} className="h-12 w-12 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" title={isChatOpen ? 'Close chat' : 'Open chat'}>
                    <svg className={`h-6 w-6 transform transition-transform ${isChatOpen ? 'rotate-45' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4-.8L3 20l1.2-3.6A8 8 0 113 12" /></svg>
                </button>
            </div>
            <div className={`fixed right-6 bottom-20 z-40 transform transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full right-0'}`} style={{ width: 380, height: 'calc(100vh - 10rem)' }}>
                 <div className="h-full w-full bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">C</div><div><p className="text-sm font-semibold">Project Chat</p><p className="text-xs text-gray-500">Chat with your team</p></div></div>
                        <button onClick={() => setIsChatOpen(false)} aria-label="Close chat" className="px-3 py-1 rounded-md hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-10.95a1 1 0 10-1.414-1.414L10 8.586 7.879 6.464a1 1 0 10-1.414 1.414L8.586 10l-2.12 2.121a1 1 0 101.414 1.415L10 11.414l2.121 2.121a1 1 0 001.414-1.415L11.414 10l2.122-2.122z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Chat projectId={projectId} />
                    </div>
                </div>
            </div>
        </>
    );
}

