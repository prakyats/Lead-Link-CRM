import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { LeadsProvider } from './contexts/LeadsContext';
import { TasksProvider } from './contexts/TasksContext';

export default function App() {
  return (
    <AuthProvider>
      <LeadsProvider>
        <TasksProvider>
          <RouterProvider router={router} />
        </TasksProvider>
      </LeadsProvider>
    </AuthProvider>
  );
}
