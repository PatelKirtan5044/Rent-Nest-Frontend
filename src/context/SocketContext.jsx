import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

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

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setNotifications((prev) => [
      { id, message, type, read: false, createdAt: new Date() },
      ...prev
    ].slice(0, 30));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Load user-specific notifications from localStorage
  useEffect(() => {
    if (user?._id) {
      const saved = localStorage.getItem(`notifications_${user._id}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [user?._id]);

  // Persist notifications to localStorage
  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?._id]);

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      return;
    }

    const socketUrl = 'https://rent-nest-backend.onrender.com';
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
      addNotification(data.message, 'info');
    });

    newSocket.on('new_maintenance_ticket', (data) => {
      addToast(data.message, 'warning');
      addNotification(data.message, 'warning');
    });

    // Tenant notification events
    newSocket.on('application_status_update', (data) => {
      const type = data.status === 'approved' ? 'success' : 'danger';
      addToast(data.message, type);
      addNotification(data.message, type);
    });

    newSocket.on('maintenance_status_update', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info');
    });

    // Shared / general workflow notification events
    newSocket.on('new_lease_agreement', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info');
    });

    newSocket.on('lease_signed', (data) => {
      addToast(data.message, 'info');
      addNotification(data.message, 'info');
    });

    newSocket.on('lease_active', (data) => {
      addToast(data.message, 'success');
      addNotification(data.message, 'success');
    });

    newSocket.on('payment_completed', (data) => {
      addToast(data.message, 'success');
      addNotification(data.message, 'success');
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
