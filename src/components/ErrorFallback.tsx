import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    message?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, message = "Something went wrong" }: ErrorFallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] w-full h-full bg-background">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-8 ring-red-500/5">
                <AlertOctagon className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {message}
            </h2>
            
            {import.meta.env.DEV && (
                <div className="max-w-xl w-full p-4 mt-4 bg-muted/20 border border-border rounded-xl text-left overflow-auto custom-scrollbar">
                    <p className="text-sm font-medium text-red-400 mb-2">{error.message}</p>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                        {error.stack}
                    </pre>
                </div>
            )}
            
            {!import.meta.env.DEV && (
                <p className="text-sm text-muted-foreground max-w-md">
                    We encountered an unexpected error. Please try reloading the page or go back to the dashboard.
                </p>
            )}

            <div className="flex items-center gap-4 mt-8">
                <button
                    onClick={resetErrorBoundary}
                    className="crm-btn-primary !px-6 !py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                </button>
                <Link
                    to="/"
                    className="crm-btn-secondary !px-6 !py-3 flex items-center gap-2 transition-all"
                >
                    <Home className="w-4 h-4" />
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
