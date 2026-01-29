import React from 'react';

interface AwaitingAdminPageProps {
  userName: string;
  onLogout: () => void;
}

const AwaitingAdminPage: React.FC<AwaitingAdminPageProps> = ({ userName, onLogout }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-2xl shadow-2xl dark:bg-slate-800">
        <svg className="w-24 h-24 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Thank you for registering, {userName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your account application has been submitted and is currently awaiting approval from an administrator.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          You will receive a notification once your account has been reviewed. You can now close this page or log out.
        </p>
        <button
          onClick={onLogout}
          className="w-full py-3 mt-4 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AwaitingAdminPage;
