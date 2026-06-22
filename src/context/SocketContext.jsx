import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth, BASE_URL } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user, apiFetch } = useAuth();

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const addNotification = useCallback((message, type = 'info', backendNotification = null) => {
    const notifId = backendNotification?._id || (Date.now() + Math.random().toString(36).substring(2, 5));
    const createdAt = backendNotification?.createdAt || new Date();
    const read = backendNotification?.read || false;

    setNotifications((prev) => {
      if (prev.some((n) => n.id === notifId)) return prev;
      return [
        { id: notifId, _id: notifId, message, type, read, createdAt: new Date(createdAt) },
        ...prev
      ].slice(0, 30);
    });
  }, []);

  // Fetch notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      const data = await apiFetch('/notifications');
      if (data.success && data.data.notifications) {
        const mapped = data.data.notifications.map((n) => ({
          id: n._id,
          _id: n._id,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user?._id, apiFetch]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user?._id) return;
    try {
      await apiFetch('/notifications/read', { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  }, [user?._id, apiFetch]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    if (!user?._id) return;
    try {
      await apiFetch('/notifications', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, [user?._id, apiFetch]);

  // Load notifications when user logs in or mounts
  useEffect(() => {
    if (user?._id) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?._id, loadNotifications]);

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      return;
    }

    const socketUrl = BASE_URL;
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected client-side:', newSocket.id);
      // Join private user room for targeted messages
      newSocket.emit('join_room', user._id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error client-side:', err.message);
    });

    // Landlord notification events
    newSocket.on('new_application', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info', data.notification);
    });

    newSocket.on('new_maintenance_ticket', (data) => {
      addToast(data.message, 'warning');
      addNotification(data.message, 'warning', data.notification);
    });

    // Tenant notification events
    newSocket.on('application_status_update', (data) => {
      const type = data.status === 'approved' ? 'success' : 'danger';
      addToast(data.message, type);
      addNotification(data.message, type, data.notification);
    });

    newSocket.on('maintenance_status_update', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info', data.notification);
    });

    // Shared / general workflow notification events
    newSocket.on('new_lease_agreement', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info', data.notification);
    });

    newSocket.on('lease_signed', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info', data.notification);
    });

    newSocket.on('lease_active', (data) => {
      addToast(data.message, 'success');
      addNotification(data.message, 'success', data.notification);
    });

    newSocket.on('payment_completed', (data) => {
      addToast(data.message, 'success');
      addNotification(data.message, 'success', data.notification);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, addToast, addNotification]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        toasts,
        notifications,
        addToast,
        removeToast,
        addNotification,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
