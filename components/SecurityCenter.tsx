import React, { useMemo } from 'react';
// FIX: Use named imports for types from the corrected types.ts file.
import { SecurityAlert, User, SecurityAction } from '../types';
import { ShieldCheckIcon, LockClosedIcon, ExclamationTriangleIcon } from './icons/IconComponents';

interface SecurityCenterProps {
  alerts: SecurityAlert[];
  allUsers: User[];
  onAction: (alertId: string | string[], action: SecurityAction, userId: string) => void;
}

interface GroupedAlert {
    latestAlert: SecurityAlert;
    count: number;
    allAlertIds: string[];
}

const SecurityCenter: React.FC<SecurityCenterProps> = ({ alerts, allUsers, onAction }) => {
  const groupedAlerts = useMemo(() => {
    const groups: { [key: string]: GroupedAlert } = {};
    
    // Sort alerts by timestamp descending to process the latest first
    const sorted = [...alerts].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(alert => {
        const key = `${alert.type}-${alert.userId}`;
        if (groups[key]) {
            groups[key].count++;
            groups[key].allAlertIds.push(alert.id);
        } else {
            groups[key] = {
                latestAlert: alert,
                count: 1,
                allAlertIds: [alert.id],
            };
        }
    });

    const finalAlerts = Object.values(groups);

    return finalAlerts.sort((a, b) => {
      // Show active alerts first, then sort by time
      if (a.latestAlert.isDismissed && !b.latestAlert.isDismissed) return 1;
      if (!a.latestAlert.isDismissed && b.latestAlert.isDismissed) return -1;
      return b.latestAlert.timestamp - a.latestAlert.timestamp;
    });
  }, [alerts]);
  
  const getUser = (userId: string) => allUsers.find(u => u.id === userId);

  const alertTypeInfo = {
    brute_force_attempt: {
      title: 'Brute-Force Attempt Detected',
      color: 'border-red-500',
      icon: ExclamationTriangleIcon,
    },
    rapid_admin_action: {
      title: 'Suspicious Admin Activity',
      color: 'border-yellow-500',
      icon: ExclamationTriangleIcon,
    },
    account_locked: {
      title: 'Account Locked',
      color: 'border-red-700 dark:border-red-500',
      icon: LockClosedIcon,
    }
  };

  const resolutionTextMap: Record<SecurityAction, string> = {
    dismiss: 'Dismissed',
    reset_pin: 'PIN Reset & Unlocked',
    force_pin_reset: 'Forced PIN Reset',
    lock: 'Account Locked',
  };
  const resolutionColorMap: Record<SecurityAction, string> = {
      dismiss: 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200',
      reset_pin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      force_pin_reset: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      lock: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-4 flex items-center">
        <ShieldCheckIcon className="w-8 h-8 mr-3 text-red-500" />
        Security Center
      </h2>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {groupedAlerts.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No security alerts.</p>
        ) : (
          groupedAlerts.map(groupedAlert => {
            const alert = groupedAlert.latestAlert;
            const info = alertTypeInfo[alert.type];
            const targetUser = getUser(alert.userId);
            const isUserLocked = targetUser?.isLocked;
            const AlertIcon = info.icon;

            return (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${alert.isDismissed ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-400 opacity-70' : `bg-white dark:bg-slate-800 shadow-md ${info.color}`}`}>
                <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <AlertIcon className={`w-8 h-8 ${alert.isDismissed ? 'text-slate-400' : info.color.replace('border-', 'text-')}`} />
                        {targetUser && <img src={targetUser.profilePicUrl || `https://i.pravatar.cc/150?u=${targetUser.id}`} alt={targetUser.name} className="w-10 h-10 rounded-full" />}
                    </div>
                    <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <h3 className={`font-bold text-lg ${alert.isDismissed ? '' : info.color.replace('border-', 'text-')}`}>{info.title}</h3>
                                {groupedAlert.count > 1 && (
                                    <span className="text-xs font-bold bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full">
                                        x{groupedAlert.count}
                                    </span>
                                )}
                            </div>
                            {alert.isDismissed && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${resolutionColorMap[alert.resolutionAction || 'dismiss']}`}>
                                    {resolutionTextMap[alert.resolutionAction || 'dismiss']}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                            On User: <strong>{targetUser?.name || 'Unknown User'}</strong> ({alert.userId})
                            </p>
                            <p className="text-xs text-slate-400">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.details}</p>
                    </div>
                </div>

                {!alert.isDismissed && (
                  <div className="mt-4 pl-14 flex items-start gap-6 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <button onClick={() => onAction(alert.id, 'reset_pin', alert.userId)} className="btn-sec-action bg-blue-500 hover:bg-blue-600 w-full">Reset PIN & Unlock</button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Admin generates a new PIN and unlocks the account immediately. The user is notified.</p>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <button onClick={() => onAction(groupedAlert.allAlertIds, 'force_pin_reset', alert.userId)} className="btn-sec-action bg-amber-500 hover:bg-amber-600 w-full">Force PIN Reset</button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">User is forced to create a new PIN on next login. New PIN requires admin approval.</p>
                    </div>
                    <div className="flex-1 min-w-[200px] sm:flex-none sm:w-auto">
                        <button onClick={() => onAction(groupedAlert.allAlertIds, 'dismiss', alert.userId)} className="btn-sec-action bg-slate-500 hover:bg-slate-600 w-full">Dismiss</button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dismisses this alert. No action is taken on the user's account.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <style>{`
        .btn-sec-action {
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 600;
            color: white;
            border-radius: 6px;
            transition: background-color 0.2s, opacity 0.2s;
        }
      `}</style>
    </div>
  );
};

export default SecurityCenter;