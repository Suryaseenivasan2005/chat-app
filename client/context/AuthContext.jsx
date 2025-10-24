import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ✅ Ensure token is sent correctly before calling checkAuth
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }
  }, [token]); // ✅ Watch token instead of empty array

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
    
    // Disconnect existing socket if any
    if (socket?.connected) {
      socket.disconnect();
    }
    
    // Create and connect new socket
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.connect();
    
    // Socket event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected");
      // Emit online status when connected
      newSocket.emit("user_online", userData._id);
    });
    
    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      // Clear online users when disconnected
      setOnlineUsers([]);
    });
    
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
    
    newSocket.on("connect_error", (error) => {
      console.log("Socket connection error:", error);
      toast.error("Connection lost. Reconnecting...");
    });
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page
        newSocket.emit("user_away", userData._id);
      } else {
        // User is back
        newSocket.emit("user_online", userData._id);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Set socket in state
    setSocket(newSocket);
    
    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (newSocket) {
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("getOnlineUsers");
        newSocket.off("connect_error");
        newSocket.disconnect();
      }
    };
  };

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
