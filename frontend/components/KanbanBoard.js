'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Modal from './Modal';
import io from 'socket.io-client';

// --- Reusable SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const IceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.172a2 2 0 01-.586 1.414l-1 1A1 1 0 003 8v2a1 1 0 001 1h1.172a2 2 0 011.414.586l1 1A1 1 0 008 13v1.172a2 2 0 01.586 1.414l-1 1A1 1 0 007 18v2a1 1 0 001 1h2a1 1 0 001-1v-1.172a2 2 0 01.586-1.414l1-1A1 1 0 0013 14V7a1 1 0 00-1-1H4a1 1 0 00-1-1H2a1 1 0 00-1 1v2a1 1 0 001 1h1.172a2 2 0 011.414.586l1 1A1 1 0 007 10v1.172a2 2 0 01-.586 1.414l-1 1A1 1 0 005 15v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H7a2 2 0 01-1.414-.586l-1-1A1 1 0 003 10V8a1 1 0 00-.293-.707L2 6.586V4a1 1 0 00-1-1H0a1 1 0 00-1 1v2a1 1 0 001 1h1.172a2 2 0 011.414.586l1 1A1 1 0 005 10v2a1 1 0 001 1h2a1 1 0 001-1v-1.172a2 2 0 01-.586-1.414l-1-1A1 1 0 007 8V6a1 1 0 00-1-1H4a1 1 0 00-1 1v1.172a2 2 0 01-1.414.586L1 9.586V12a1 1 0 001 1h2a1 1 0 001-1V9.828a2 2 0 011.414-1.414l1.586-1.586A2 2 0 0110 5.414V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1.414a2 2 0 01-1.414 1.414L3 8.414V11a1 1 0 001 1h2a1 1 0 001-1V9.414a2 2 0 011.414-1.414L9 6.586V5a1 1 0 00-1-1H6a1 1 0 00-1 1v1.586a2 2 0 01-1.414 1.414L2 9.414V12a1 1 0 001 1h1a1 1 0 001-1V9.586a2 2 0 011.414-1.414L8 6.586V5a1 1 0 00-1-1H5a1 1 0 00-1 1z" clipRule="evenodd" /></svg>;

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
  
  const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleSummarize = async () => {
      setIsSummarizing(true);
      await onSummarize(task);
      setIsSummarizing(false);
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 group relative cursor-grab hover:shadow-md hover:-translate-y-1 transition-all duration-200"
        >
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
              {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
              )}
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
            <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="w-full flex items-center justify-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
                        <TaskCard 
                          key={task._id} 
                          task={task} 
                          index={index} 
                          onDelete={onDeleteTask} 
                          onEdit={onEditTask}
                          onSummarize={onSummarizeTask}
                        />
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

export default function KanbanBoard({ projectId, projectMembers }) {
  const { token, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskData, setTaskData] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', assignee: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!projectId || authLoading) return;
    const socket = io('http://localhost:5001');
    socket.emit('joinProject', projectId);
    
    socket.on('taskCreated', (newTask) => setTasks(prev => [...prev, newTask]));
    socket.on('taskUpdated', (updatedTask) => setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t)));
    socket.on('taskDeleted', (deletedTaskId) => setTasks(prev => prev.filter(t => t._id !== deletedTaskId)));

    return () => socket.disconnect();
  }, [projectId, authLoading]);

  useEffect(() => {
    const fetchTasks = async () => {
        if (authLoading || !token || !projectId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:5001/api/tasks?projectId=${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setTasks(data.data);
            else throw new Error(data.msg || 'Failed to fetch tasks');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    if(!authLoading) fetchTasks();
  }, [projectId, token, authLoading]);
  
  const handleFormChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (editingTask) await handleUpdateTask();
    else await handleAddTask();
  };

  const handleAddTask = async () => {
    if (!taskData.title.trim()) { setFormError("Task title is required."); return; }
    setFormError('');
    try {
        const res = await fetch('http://localhost:5001/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...taskData, project: projectId, status: 'To Do' }),
        });
        const data = await res.json();
        if (data.success) {
            setIsModalOpen(false);
            setTaskData({ title: '', description: '', priority: 'Medium', dueDate: '', assignee: '' });
        }
        else setFormError(data.msg || "Failed to create task.");
    } catch (error) {
        setFormError("An error occurred.");
    }
  };

  const handleUpdateTask = async () => {
    if (!taskData.title.trim()) { setFormError("Task title is required."); return; }
    setFormError('');
    try {
        const res = await fetch(`http://localhost:5001/api/tasks/${editingTask._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(taskData)
        });
        const data = await res.json();
        if (data.success) {
            setIsModalOpen(false);
            setEditingTask(null);
        } else {
            setFormError(data.msg || "Failed to update task.");
        }
    } catch (error) {
        setFormError("An error occurred.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      setError("Failed to delete task.");
    }
  };
  
  const handleSummarizeTask = async (task) => {
    try {
        const res = await fetch('http://localhost:5001/api/ai/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: task.title, description: task.description }),
        });
        const data = await res.json();
        if (data.success) {
            await fetch(`http://localhost:5001/api/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ description: data.data }),
            });
        }
    } catch (error) {
        console.error("Failed to summarize task:", error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    
    try {
        await fetch(`http://localhost:5001/api/tasks/${draggableId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: destination.droppableId }),
        });
    } catch (error) {
        console.error("Failed to update task status:", error);
    }
  };

  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setTaskData({ title: '', description: '', priority: 'Medium', dueDate: '', assignee: '' });
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  if (loading || authLoading) return <p className="text-center text-gray-500 py-10">Loading tasks...</p>;
  if (error) return <p className="text-center text-red-500 py-10">Error: {error}</p>;

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-4">
            {columns.map(status => (
                <KanbanColumn
                key={status}
                title={status}
                projectId={projectId}
                tasks={tasks.filter(task => task.status === status)}
                onOpenModal={handleOpenAddTaskModal}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleOpenEditTaskModal}
                onSummarizeTask={handleSummarizeTask}
                />
            ))}
            </div>
        </DragDropContext>
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Edit Task" : "Add a New Task"}>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={taskData.title}
                    onChange={handleFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={taskData.description}
                    onChange={handleFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assign To</label>
                  <select
                      id="assignee"
                      name="assignee"
                      value={taskData.assignee}
                      onChange={handleFormChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900"
                  >
                      <option value="">Unassigned</option>
                      {projectMembers && projectMembers.map(member => (
                          <option key={member.user._id} value={member.user._id} className="text-gray-900">
                              {member.user.name}
                          </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                            id="priority"
                            name="priority"
                            value={taskData.priority}
                            onChange={handleFormChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900"
                        >
                            <option className="text-gray-900">Low</option>
                            <option className="text-gray-900">Medium</option>
                            <option className="text-gray-900">High</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={taskData.dueDate}
                            onChange={handleFormChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        />
                    </div>
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
        </Modal>
    </>
  );
}

