"use client"

import React, { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

/**
 * @deprecated Use NotificationProvider from notification-context.tsx instead.
 * This context is kept for backward compatibility and re-exports from NotificationProvider.
 */
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

/**
 * @deprecated Use NotificationProvider instead. 
 * This wrapper no longer creates its own socket connection to avoid duplicates.
 */
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    // No longer creates a duplicate socket - use NotificationProvider instead
    return (
        <SocketContext.Provider value={{ socket: null, isConnected: false }}>
            {children}
        </SocketContext.Provider>
    );
};
