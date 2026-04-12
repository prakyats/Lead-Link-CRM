import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    message?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    }

    public resetError = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <ErrorFallback 
                    error={this.state.error} 
                    resetErrorBoundary={this.resetError} 
                    message={this.props.message}
                />
            );
        }

        return this.props.children;
    }
}
