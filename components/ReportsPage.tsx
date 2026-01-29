import React, { FC, useMemo } from 'react';
import { User, Connection } from '../types';
import { ArrowLeftIcon } from './icons/IconComponents';

type ReportType = 'total_users' | 'new_users' | 'active_connections';

interface ReportsPageProps {
  reportType: ReportType;
  allUsers: User[];
  connections: Connection[];
  onBack: () => void;
}

const ReportsPage: FC<ReportsPageProps> = ({ reportType, allUsers, connections, onBack }) => {

    const reportData = useMemo(() => {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        switch (reportType) {
            case 'total_users':
                return {
                    title: 'All Platform Users',
                    description: 'A complete list of all active students, teachers, and parents.',
                    headers: ['Name', 'Role', 'Platform ID', 'Email', 'Registration Date'],
                    rows: allUsers
                        .filter(u => u.role !== 'admin')
                        .map(u => [
                            u.name,
                            u.role,
                            u.studentId || u.teacherId || u.parentId,
                            u.email,
                            u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
                        ])
                };
            case 'new_users':
                return {
                    title: 'New Users This Week',
                    description: 'All users who registered in the last 7 days.',
                    headers: ['Name', 'Role', 'Email', 'Registration Date'],
                     rows: allUsers
                        .filter(u => u.createdAt && u.createdAt > oneWeekAgo)
                        .map(u => [
                            u.name,
                            u.role,
                            u.email,
                            new Date(u.createdAt!).toLocaleString()
                        ])
                };
            case 'active_connections':
                 return {
                    title: 'Active Student-Teacher Connections',
                    description: 'A list of all currently active connections on the platform.',
                    headers: ['Student', 'Teacher', 'Connection Started'],
                     rows: connections
                        .filter(c => c.status === 'active')
                        .map(c => {
                            const student = allUsers.find(u => u.id === c.studentId);
                            const teacher = allUsers.find(u => u.id === c.teacherId);
                            return [
                                student?.name || 'Unknown Student',
                                teacher?.name || 'Unknown Teacher',
                                new Date(c.startedAt).toLocaleDateString()
                            ]
                        })
                };
            default:
                return { title: 'Report', description: '', headers: [], rows: [] };
        }
    }, [reportType, allUsers, connections]);


    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{reportData.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{reportData.description}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            {reportData.headers.map(header => (
                                <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {reportData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 capitalize font-medium">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {reportData.rows.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-slate-500">No data available for this report.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;