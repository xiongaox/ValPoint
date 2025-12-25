/**
 * main.tsx (Admin) - 后台管理系统入口点
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <AdminApp />
    </React.StrictMode>
);
