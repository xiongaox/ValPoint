/**
 * main.tsx (User) - 共享库个人中心入口点
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import UserApp from './UserApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <UserApp />
    </React.StrictMode>
);
