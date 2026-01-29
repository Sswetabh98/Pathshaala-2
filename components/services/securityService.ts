import { User, SecurityAlert } from '../types';

const ACTION_THRESHOLD = 3; // Number of actions to be considered "rapid"
const TIME_WINDOW_MS = 5000; // 5 seconds time window

let recentActions: { adminId: string, targetUserId: string, timestamp: number }[] = [];

/**
 * Detects suspicious activity based on a series of user updates.
 * Currently checks for rapid, repetitive status changes by an admin.
 * @param oldUsers The array of users before the update.
 * @param newUsers The array of users after the update.
 * @param adminUser The admin performing the action.
 * @returns A security alert if suspicious activity is detected, otherwise null.
 */
export const detectSuspiciousActivity = (oldUsers: User[], newUsers: User[], adminUser: User): SecurityAlert | null => {
    const changes = newUsers.filter((newUser, index) => {
        const oldUser = oldUsers.find(u => u.id === newUser.id);
        return oldUser && JSON.stringify(newUser.profile) !== JSON.stringify(oldUser.profile);
    });

    if (changes.length > 0) {
        const now = Date.now();
        
        // Record each change as an action by the specific admin
        changes.forEach(change => recentActions.push({ adminId: adminUser.id, targetUserId: change.id, timestamp: now }));

        // Filter out actions outside the time window
        recentActions = recentActions.filter(action => now - action.timestamp < TIME_WINDOW_MS);
        
        // Check actions for the current admin
        const adminActions = recentActions.filter(action => action.adminId === adminUser.id);
        
        // If the number of actions within the window exceeds the threshold, trigger an alert
        if (adminActions.length >= ACTION_THRESHOLD) {
            const alert: SecurityAlert = {
                id: `alert-${Date.now()}`,
                type: 'rapid_admin_action',
                timestamp: now,
                userId: changes[0].id, // The first user changed in this batch
                details: `Detected ${adminActions.length} user status changes by admin ${adminUser.name} within ${TIME_WINDOW_MS / 1000} seconds. This could indicate a compromised admin account or a malicious script.`,
                isDismissed: false,
            };
            // Reset actions for this admin after triggering an alert to avoid spamming
            recentActions = recentActions.filter(action => action.adminId !== adminUser.id);
            return alert;
        }
    }
    
    return null;
};