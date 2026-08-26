import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // ✅ Ensure token is sent correctly before calling checkAuth
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }
  }, [token]); // ✅ Watch token instead of empty array

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Request notification permission on load (silently)
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => setNotificationPermission(perm));
    }
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error("Session expired. Please log in again.");
      setAuthUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`; // ✅ Set token immediately
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loginDemo = async () => {
    try {
      const { data } = await axios.post('/api/auth/demo-login');
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["Authorization"] = null;
    toast.success("Logged out successfully");
    if (socket) socket.disconnect();
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const connectSocket = (userData) => {
    if (!userData) return;

    // Only create new socket if one doesn't exist
    if (!socket) {
      const newSocket = io(backendUrl, {
        query: { userId: userData._id },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000
      });

      newSocket.on("getOnlineUsers", (userIds) => {
        setOnlineUsers(userIds);
      });
      // Incoming call notification
      newSocket.on('call_initiate', (data) => {
        try {
          if (notificationPermission === 'granted') {
            const title = `${data.caller?.fullName || 'Caller'} is calling`;
            const body = data.isVideoCall ? 'Video call' : 'Voice call';
            const n = new Notification(title, { body });
            n.onclick = () => window.focus();
          }
        } catch (err) {
          // ignore
        }
      });

      setSocket(newSocket);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    loginDemo,
    logout,
    updateProfile,
    showInstallBanner,
    handleInstallClick,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showInstallBanner && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#282142] text-white p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div>
            <p className="font-semibold">Install</p>
          </div>
          <div className="ml-3">
            <button onClick={handleInstallClick} className="bg-green-600 px-3 py-1 rounded-md">Install</button>
            <button onClick={() => setShowInstallBanner(false)} className="ml-2 text-sm text-gray-300">Close</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
