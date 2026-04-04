import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UIContextType {
    isGlobalLoading: boolean;
    coldStartMessage: string | null;
    setIsGlobalLoading: (loading: boolean) => void;
    setColdStartMessage: (message: string | null) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Global reference for non-React files like api.ts
let uiStateRef: {
    setIsGlobalLoading: (loading: boolean) => void;
    setColdStartMessage: (message: string | null) => void;
} | null = null;

export const setGlobalLoading = (loading: boolean) => {
    uiStateRef?.setIsGlobalLoading(loading);
};

export const setGlobalColdStartMessage = (message: string | null) => {
    uiStateRef?.setColdStartMessage(message);
};

export function UIProvider({ children }: { children: ReactNode }) {
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [coldStartMessage, setColdStartMessage] = useState<string | null>(null);

    // Initialize the global reference
    uiStateRef = {
        setIsGlobalLoading,
        setColdStartMessage,
    };

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        // This is a placeholder for sonner integration if needed directly in context
        // But api.ts can also import toast from 'sonner' directly.
    }, []);

    return (
        <UIContext.Provider value={{ 
            isGlobalLoading, 
            coldStartMessage, 
            setIsGlobalLoading, 
            setColdStartMessage,
            showToast 
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}