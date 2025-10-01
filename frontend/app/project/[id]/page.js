'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import KanbanBoard from '../../../components/KanbanBoard';
import Modal from '../../../components/Modal';
import Chat from '../../../components/chat';

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
    
    // --- FIX: Define the production API URL from environment variables ---
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const isAdmin = useMemo(() => {
        if (!project || !user) return false;
        const currentUserInProject = project.members.find(
            (member) => member.user?._id === user.id
        );
        return currentUserInProject?.role === 'admin';
    }, [project, user]);

    const fetchProject = useCallback(async () => {
        if (authLoading || !token || !projectId || !apiUrl) return;
        try {
            setLoading(true);
            setError(null);
            // --- FIX: Use the apiUrl variable ---
            const res = await fetch(`${apiUrl}/api/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        // Auth check is handled by AuthContext, so we just fetch the project
        fetchProject();
    }, [fetchProject]);

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setInviteMessage({ type: '', text: '' });
        if (!inviteEmail || !apiUrl) return;
        try {
            // --- FIX: Use the apiUrl variable ---
            const res = await fetch(`${apiUrl}/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: inviteEmail }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setInviteMessage({ type: 'success', text: 'Member invited successfully!' });
                setInviteEmail('');
                await fetchProject();
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
            // --- FIX: Use the apiUrl variable ---
            const res = await fetch(
                `${apiUrl}/api/projects/${projectId}/members/${memberToRemove.user._id}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
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
            // --- FIX: Use the apiUrl variable ---
            const res = await fetch(
                `${apiUrl}/api/projects/${projectId}/members/${memberId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role: newRole }),
                }
            );
            const data = await res.json();
            if (data.success) {
                setProject(data.data); // Optimistically update state or refetch
            } else {
                throw new Error(data.msg || 'Failed to update role.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || authLoading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Loading project...</p>
            </div>
        );
    if (error)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    if (!project)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Project not found.</p>
            </div>
        );

    return (
        // The rest of your JSX remains the same
        <>
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                        <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
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
                                {project.members.map(({ user: memberUser, role }) => memberUser && (
                                    <div key={memberUser._id} className="flex items-center justify-between pt-4 first:pt-0">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                {memberUser.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-semibold text-gray-800">{memberUser.name}</p>
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
                                                <span className="text-sm font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                                                    {role}
                                                </span>
                                            )}
                                            {isAdmin && project.owner !== memberUser._id && (
                                                <button onClick={() => handleOpenRemoveModal({ user: memberUser, role })} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors" aria-label={`Remove ${memberUser.name}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {isAdmin && (
                                <form onSubmit={handleInviteMember} className="mt-6 border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-800">Invite New Member</h3>
                                    <div className="flex items-center mt-2 gap-4">
                                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter member's email" className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500" required />
                                        <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                            Invite
                                        </button>
                                    </div>
                                    {inviteMessage.text && (
                                        <p className={`mt-2 text-sm ${inviteMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                            {inviteMessage.text}
                                        </p>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Board</h2>
                        <KanbanBoard projectId={projectId} projectMembers={project.members} />
                    </div>
                </main>
            </div>

            <Modal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} title="Confirm Member Removal">
                {memberToRemove && (
                    <div>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to remove <span className="font-bold">{memberToRemove.user.name}</span> from this project?
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsRemoveModalOpen(false)} className="py-2 px-4 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 text-gray-700">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConfirmRemoveMember} className="py-2 px-4 border rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                                Remove Member
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="fixed right-6 bottom-6 z-50">
                <button onClick={() => setIsChatOpen((v) => !v)} aria-label={isChatOpen ? 'Close chat' : 'Open chat'} className="h-12 w-12 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" title={isChatOpen ? 'Close chat' : 'Open chat'}>
                    <svg className={`h-6 w-6 transform transition-transform ${isChatOpen ? 'rotate-45' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4-.8L3 20l1.2-3.6A8 8 0 113 12" />
                    </svg>
                </button>
            </div>
            <div className={`fixed right-6 bottom-6 z-40 transform transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: 380, height: '80vh' }}>
                <div className="h-full w-full bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">C</div>
                            <div>
                                <p className="text-sm font-semibold">Project Chat</p>
                                <p className="text-xs text-gray-500">Chat with your team</p>
                            </div>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} aria-label="Close chat" className="px-3 py-1 rounded-md hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-10.95a1 1 0 10-1.414-1.414L10 8.586 7.879 6.464a1 1 0 10-1.414 1.414L8.586 10l-2.12 2.121a1 1 0 101.414 1.415L10 11.414l2.121 2.121a1 1 0 001.414-1.415L11.414 10l2.122-2.122z" clipRule="evenodd" />
                            </svg>
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

