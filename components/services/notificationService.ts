import { SecurityAlert, User } from '../types';

export const sendEmailNotification = (alert: SecurityAlert, recipient: User): void => {
    const emailContent = `
--- SIMULATED EMAIL NOTIFICATION ---
To: ${recipient.email}
From: security@pathshaala.com
Subject: 🚨 CRITICAL SECURITY ALERT on your Pathshaala account

Hello ${recipient.name},

A critical security alert has been triggered on the Pathshaala platform. Please review the details below immediately.

Alert Type: ${alert.type.replace(/_/g, ' ').toUpperCase()}
Timestamp: ${new Date(alert.timestamp).toLocaleString()}
Details: ${alert.details}

We recommend logging into your administrator dashboard to review the situation and take appropriate action.

Thank you,
Pathshaala Security Team
------------------------------------
    `;
    console.log(emailContent);
};

export const sendPinResetEmail = (name: string, email: string, newPin: string): void => {
    const emailContent = `
--- SIMULATED EMAIL NOTIFICATION ---
To: ${email}
Subject: Your Pathshaala PIN has been reset by an administrator

Hello ${name},

An administrator has reset your PIN for security reasons.

Your new 6-digit PIN is: ${newPin}

Please log in with this new PIN. You can also retrieve this PIN from the "Check Application Status" tool on the login page.

Thank you,
Pathshaala Support Team
------------------------------------
    `;
    console.log(emailContent);
};