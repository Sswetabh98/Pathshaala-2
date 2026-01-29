import React, { useState, useMemo, useEffect } from 'react';
import { User, Connection, StudentProfile, TeacherProfile } from '../types';
import Connect from './Connect';
import ConnectionsManager from './ConnectionsManager';
import { SearchIcon, LinkIcon } from './icons/IconComponents';

interface NetworkManagerProps {
    currentUser: User;
    allUsers: User[];
    connections: Connection[];
    onConnectionRequest: (fromUser: User, toUserId: string) => void;
    onWithdrawConnectionRequest: (fromUser: User, toUserId: string) => void;
    onAcceptRequest: (fromUserId: string) => void;
    onRejectRequest: (fromUserId: string) => void;
    onTerminateConnection: (connId: string) => void;
    subView?: string | null;
}

const NetworkManager: React.FC<NetworkManagerProps> = (props) => {
    const { subView } = props;
    const pendingRequestCount = useMemo(() => {
        const myProfile = props.currentUser.profile as TeacherProfile;
        const incomingCount = myProfile.connectionRequests?.filter(req => req.status === 'pending').length || 0;
        
        let outgoingCount = 0;
        props.allUsers.forEach(user => {
            if (user.role === 'student') {
                const theirProfile = user.profile as StudentProfile;
                const reqToMe = theirProfile.connectionRequests?.find(req => req.userId === props.currentUser.id && req.status === 'pending');
                if (reqToMe) {
                    outgoingCount++;
                }
            }
        });
        return incomingCount + outgoingCount;
    }, [props.currentUser, props.allUsers]);
    
    const [activeTab, setActiveTab] = useState(pendingRequestCount > 0 ? 'manage' : 'find');
    
    useEffect(() => {
        if (subView === 'active') {
            setActiveTab('manage');
        }
    }, [subView]);

    const tabs = [
        { id: 'find', label: 'Find Connections', icon: SearchIcon },
        { id: 'manage', label: 'Manage Connections', icon: LinkIcon },
    ];
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-center p-1 bg-gray-200 dark:bg-slate-900/50 rounded-lg">
                    {tabs.map(tab => {
                        const isManageTab = tab.id === 'manage';
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full py-2.5 text-sm font-medium rounded-md capitalize transition-all duration-300 flex items-center justify-center gap-2 ${
                                    activeTab === tab.id ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                                {isManageTab && pendingRequestCount > 0 && (
                                    <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequestCount}</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-0 p-6">
                {activeTab === 'find' && (
                    <Connect
                        currentUser={props.currentUser}
                        allUsers={props.allUsers}
                        connections={props.connections}
                        onConnectionRequest={props.onConnectionRequest}
                        onWithdrawConnectionRequest={props.onWithdrawConnectionRequest}
                    />
                )}
                {activeTab === 'manage' && (
                    <ConnectionsManager
                        currentUser={props.currentUser}
                        allUsers={props.allUsers}
                        connections={props.connections}
                        onAcceptRequest={props.onAcceptRequest}
                        onRejectRequest={props.onRejectRequest}
                        onWithdrawRequest={(toUserId) => props.onWithdrawConnectionRequest(props.currentUser, toUserId)}
                        onTerminateConnection={props.onTerminateConnection}
                        subView={subView}
                    />
                )}
            </div>
        </div>
    );
};

export default NetworkManager;