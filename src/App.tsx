import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { LeadsProvider } from './contexts/LeadsContext';
import { TasksProvider } from './contexts/TasksContext';

export default function App() {
  return (
    <AuthProvider>
      <LeadsProvider>
        <TasksProvider>
          <Toaster 
            position="top-center" 
            richColors 
            theme="dark"
            toastOptions={{
              style: { 
                background: 'rgba(15, 23, 42, 0.9)', 
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                color: '#F1F5F9',
                borderRadius: '12px'
              },
            }} 
          />
          <RouterProvider router={router} />
        </TasksProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}
