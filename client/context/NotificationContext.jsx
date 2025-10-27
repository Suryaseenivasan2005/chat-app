import { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.jsx';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { axios, authUser } = useContext(AuthContext);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/friends/requests');
      if (data.success) {
        setNotifications(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error.message);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      const { data } = await axios.put(`/api/friends/request/${requestId}`, { action });
      if (data.success) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(req => req._id !== requestId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to respond to request:', error.message);
      return false;
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser]);

  const value = {
    notifications,
    showNotificationModal,
    setShowNotificationModal,
    fetchNotifications,
    respondToRequest
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
