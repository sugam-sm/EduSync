import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, FolderOpen, FileText, BookCopy, MessageSquare, Info, X } from 'lucide-react';
import { type RootState, type AppDispatch } from '../store';
import { addToast } from '../features/toasts/toastSlice';
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllRead,
    clearAllNotifications,
    addNotification,
    type Notification
} from '../features/notifications/notificationSlice';

const getIcon = (type: string) => {
    switch (type) {
        case 'RESOURCE': return <FolderOpen size={16} strokeWidth={2.5} />;
        case 'QUIZ': return <FileText size={16} strokeWidth={2.5} />;
        case 'FLASHCARD': return <BookCopy size={16} strokeWidth={2.5} />;
        case 'REMARK': return <MessageSquare size={16} strokeWidth={2.5} />;
        default: return <Info size={16} strokeWidth={2.5} />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'RESOURCE': return 'text-info';
        case 'QUIZ': return 'text-warning';
        case 'FLASHCARD': return 'text-success';
        case 'REMARK': return 'text-primary';
        default: return 'text-text-muted';
    }
};

const getTypeBg = (type: string) => {
    switch (type) {
        case 'RESOURCE': return 'bg-info/15';
        case 'QUIZ': return 'bg-warning/15';
        case 'FLASHCARD': return 'bg-success/15';
        case 'REMARK': return 'bg-primary/15';
        default: return 'bg-text-muted/15';
    }
};

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

export const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);
    const { isAuthenticated } = useSelector((state: RootState) => state.login);

    // Fetch on mount + setup SSE connection
    useEffect(() => {
        if (!isAuthenticated) return;
        
        dispatch(fetchUnreadCount());
        
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const eventSource = new EventSource(`http://localhost:8000/api/notifications/stream/?token=${token}`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event_type === 'new' && data.notification) {
                    dispatch(addNotification(data.notification));
                    dispatch(addToast({
                        message: data.notification.title,
                        type: 'info'
                    }));
                }
            } catch (err) {
                console.error("SSE parsing error", err);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            // Optional: You could write reconnect logic here, 
            // but native EventSource auto-reconnects by default 
            // unless we explicitly close it.
        };

        return () => {
            eventSource.close();
        };
    }, [dispatch, isAuthenticated]);

    // Fetch full list when opened
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [isOpen, dispatch, isAuthenticated]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.is_read) {
            dispatch(markNotificationRead(notif.id));
        }
        if (notif.action_url) {
            navigate(notif.action_url);
        }
        setIsOpen(false);
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell Button */}
            <button
                id="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/30 text-primary hover:bg-primary/10 transition-all duration-300 cursor-pointer"
            >
                <Bell size={18} strokeWidth={2.5} className={unreadCount > 0 ? 'animate-[swing_0.5s_ease-in-out]' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-failure text-white text-[10px] font-bold rounded-full px-1 shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-14 w-[380px] max-h-[480px] bg-surface border-2 border-light/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-[fadeSlideDown_0.2s_ease-out]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-light/10">
                        <h3 className="text-text-heading font-bold text-sm tracking-tight">Notifications</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => dispatch(markAllRead())}
                                    title="Mark all as read"
                                    className="p-1.5 rounded-lg hover:bg-success/10 text-text-muted hover:text-success transition-all cursor-pointer"
                                >
                                    <CheckCheck size={16} strokeWidth={2.5} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => dispatch(clearAllNotifications())}
                                    title="Clear all"
                                    className="p-1.5 rounded-lg hover:bg-failure/10 text-text-muted hover:text-failure transition-all cursor-pointer"
                                >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-failure/10 text-text-muted hover:text-failure transition-all cursor-pointer ml-1"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
                                <Bell size={32} strokeWidth={1.5} className="opacity-30" />
                                <p className="text-sm font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-light/5 transition-all duration-200 cursor-pointer hover:bg-primary/5 ${
                                        !notif.is_read ? 'bg-primary/5' : ''
                                    }`}
                                >
                                    {/* Type Icon */}
                                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${getTypeBg(notif.notification_type)} ${getTypeColor(notif.notification_type)}`}>
                                        {getIcon(notif.notification_type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-text-heading truncate">{notif.title}</span>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-text-body mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                                        <span className="text-[10px] text-text-muted font-semibold mt-1 block">{timeAgo(notif.created_at)}</span>
                                    </div>

                                    {/* Mark as read button */}
                                    {!notif.is_read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dispatch(markNotificationRead(notif.id));
                                            }}
                                            title="Mark as read"
                                            className="mt-1 p-1 rounded-lg hover:bg-success/10 text-text-muted hover:text-success transition-all shrink-0 cursor-pointer"
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </button>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {unreadCount > 0 && (
                        <div className="px-4 py-2 border-t border-light/10 bg-surface/80">
                            <span className="text-[11px] text-text-muted font-semibold">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
