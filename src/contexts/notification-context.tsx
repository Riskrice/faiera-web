"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "@/contexts/auth-context"
import {
    getNotifications,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    Notification
} from "@/lib/api"
import { toast } from "sonner"

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    isConnected: boolean
    fetchNotifications: (page?: number) => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    hasMore: boolean
    loadMore: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { accessToken, user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Socket ref to prevent re-creation
    const socketRef = useRef<Socket | null>(null)
    // Audio ref for notification sound
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    // Remove /api/v1 from the end if it exists to get the base URL for socket
    const socketUrl = apiUrl.replace('/api/v1', '')

    useEffect(() => {
        // Initialize notification sound
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3') // Make sure this file exists in public
            audioRef.current.volume = 0.5
        }
    }, [])

    const fetchNotifications = useCallback(async (pageNum = 1) => {
        if (!accessToken) return

        try {
            if (pageNum === 1) setIsLoading(true)

            const [notifsResponse, countResponse] = await Promise.all([
                getNotifications(pageNum),
                getUnreadNotificationsCount()
            ])

            const newNotifications = notifsResponse.data || []

            if (pageNum === 1) {
                setNotifications(newNotifications)
            } else {
                setNotifications(prev => [...prev, ...newNotifications])
            }

            setUnreadCount(countResponse.data?.count || 0)
            setHasMore(newNotifications.length > 0)
            setPage(pageNum)

        } catch (error) {
            console.error("Failed to fetch notifications", error)
        } finally {
            setIsLoading(false)
        }
    }, [accessToken])

    // Initial load
    useEffect(() => {
        if (accessToken) {
            fetchNotifications(1)
        } else {
            setNotifications([])
            setUnreadCount(0)
        }
    }, [accessToken, fetchNotifications])

    // Socket Connection Logic
    useEffect(() => {
        if (!accessToken || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
                setIsConnected(false)
            }
            return
        }

        // Connect only if not already connected
        if (!socketRef.current) {
            const newSocket = io(`${socketUrl}/notifications`, {
                auth: { token: accessToken },
                transports: ['websocket'],
                reconnection: true,
            })

            newSocket.on('connect', () => {
                console.log('Notification socket connected')
                setIsConnected(true)
            })

            newSocket.on('disconnect', () => {
                console.log('Notification socket disconnected')
                setIsConnected(false)
            })

            // Handle real-time notifications
            newSocket.on('notification', (payload: { type: string, data: any }) => {
                console.log('New notification received:', payload)

                // Play sound
                audioRef.current?.play().catch(() => {/* Ignore autoplay errors */ })

                // Add to list
                const newNotification = payload.data as Notification
                setNotifications(prev => [newNotification, ...prev])
                setUnreadCount(prev => prev + 1)

                // Show Toast
                toast(newNotification.titleAr, {
                    description: newNotification.bodyAr,
                    action: {
                        label: "عرض",
                        onClick: () => { /* Add navigation logic later if needed */ }
                    }
                })
            })

            // Handle unread count updates
            newSocket.on('notification:count', (payload: { unreadCount: number }) => {
                setUnreadCount(payload.unreadCount)
            })

            socketRef.current = newSocket
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
                setIsConnected(false)
            }
        }
    }, [accessToken, user, socketUrl])

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ))

            // Only decrement if it was unread
            const wasUnread = notifications.find(n => n.id === id && !n.readAt)
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }

            await markNotificationAsRead(id)
        } catch (error) {
            console.error("Failed to mark notification as read", error)
            // Revert changes could be added here
            fetchNotifications(1) // Sync with server on error
        }
    }

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
            setUnreadCount(0)

            await markAllNotificationsAsRead()
        } catch (error) {
            console.error("Failed to mark all as read", error)
            fetchNotifications(1)
        }
    }

    const loadMore = async () => {
        if (!isLoading && hasMore) {
            await fetchNotifications(page + 1)
        }
    }

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            isConnected,
            fetchNotifications: () => fetchNotifications(1),
            markAsRead,
            markAllAsRead,
            hasMore,
            loadMore
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}
