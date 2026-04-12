import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { GlobalLoader } from './components/GlobalLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: true,
    },
    mutations: {
      throwOnError: true,
    }
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <AuthProvider>
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
          <GlobalLoader />
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary 
                onReset={reset}
                message="Fatal Application Error Encountered"
              >
                <RouterProvider router={router} />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
        </AuthProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
