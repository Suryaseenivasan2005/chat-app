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
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Tracks the authoritative demo expiry timestamp (epoch ms) — set by server
  const [demoExpiresAt, setDemoExpiresAt] = useState(null);
  // When true, the expiry overlay is shown
  const [demoExpired, setDemoExpired] = useState(false);

  // ✅ Ensure token is sent correctly before calling checkAuth
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }
  }, [token]);

  // Request notification permission on load (silently)
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => setNotificationPermission(perm));
    }
  }, []);

  // Global axios response interceptor — catch expired demo sessions
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.demoExpired) {
          handleDemoExpired();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const handleDemoExpired = () => {
    // Clear credentials but keep the expiry screen visible
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setDemoExpiresAt(null);
    axios.defaults.headers.common["Authorization"] = null;
    if (socket) socket.disconnect();
    setDemoExpired(true);
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
        // Restore demo expiry from stored token payload
        if (data.user.isDemo && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.expiresAt) setDemoExpiresAt(payload.expiresAt);
          } catch (_) { /* ignore decode errors */ }
        }
      }
    } catch (error) {
      // Handle expired demo tokens gracefully
      if (error.response?.data?.demoExpired) {
        handleDemoExpired();
        return;
      }
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

  /**
   * Phase 1: Initialize a pending demo session (called on /demo page load).
   * Returns { token, userData, sessionId } without starting the timer.
   */
  const initDemo = async () => {
    try {
      const { data } = await axios.post("/api/demo/init");
      if (data.success) {
        return { success: true, token: data.token, userData: data.userData, sessionId: data.sessionId };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to initialize demo" };
    }
  };

  /**
   * Phase 2: Activate the session (called on CONTINUE DEMO click).
   * Starts the 15-minute countdown server-side.
   */
  const startDemo = async (sessionId, pendingToken) => {
    try {
      // Use the pending token for this one call
      const { data } = await axios.post("/api/demo/start", { sessionId }, {
        headers: { Authorization: `Bearer ${pendingToken}` }
      });
      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setAuthUser(data.userData);
        setDemoExpiresAt(data.expiresAt);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        connectSocket(data.userData);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to start demo" };
    }
  };

  /**
   * Reset the current demo session: wipes all data, re-seeds, resets timer to 15:00.
   */
  const resetDemo = async () => {
    try {
      const { data } = await axios.post("/api/demo/reset");
      if (data.success) {
        // Update token (new demoUserId after re-seed)
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setAuthUser(data.userData);
        setDemoExpiresAt(data.expiresAt);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        // Reconnect socket with new userId
        if (socket) socket.disconnect();
        setSocket(null);
        connectSocket(data.userData);

        toast.success("Demo reset! Starting fresh 🔄");
        return true;
      }
      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset demo");
      return false;
    }
  };

  // Keep the old loginDemo for any stale imports — it now just calls initDemo + startDemo
  const loginDemo = async () => {
    const init = await initDemo();
    if (!init.success) { toast.error(init.message); return false; }
    const start = await startDemo(init.sessionId, init.token);
    if (!start.success) { toast.error(start.message); return false; }
    return true;
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setDemoExpiresAt(null);
    setDemoExpired(false);
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

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    loginDemo,
    initDemo,
    startDemo,
    resetDemo,
    logout,
    updateProfile,
    demoExpiresAt,
    demoExpired,
    setDemoExpired,
    handleDemoExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
