/**
 * main.tsx (Shared) - 共享库应用入口点
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import SharedApp from './SharedApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <SharedApp />
    </React.StrictMode>
);
