import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isTypingFrom, setIsTypingFrom] = useState(null);
  const [isRecordingFrom, setIsRecordingFrom] = useState(null);
  const [groups, setGroups] = useState([]);
  const { socket, axios, authUser } = useContext(AuthContext);
const getUsers = async () => {
  try {
    const { data } = await axios.get("/api/messages/users");
    if (data.success && Array.isArray(data.users)) {
      setUsers(data.users);
      setUnseenMessages(data.unseenMessages || {});
    }
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
  }
};


  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
        setUnseenMessages((prev) => ({
          ...prev,
          [userId]: 0,
        }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isCurrentChat = selectedUser && newMessage.senderId === selectedUser._id;

      if (isCurrentChat) {
        // For bot messages, add a delay before showing them
        if (newMessage.senderId !== authUser._id && users.find(u => u._id === newMessage.senderId)?.isBot) {
          setTimeout(() => {
            newMessage.seen = true;
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            axios.put(`/api/messages/mark/${newMessage._id}`);
          }, 1000); // 1 second delay for bot messages
        } else {
          newMessage.seen = true;
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          axios.put(`/api/messages/mark/${newMessage._id}`);
        }
        
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: 0,
        }));
      } else {
        // ✅ Ensure bot replies are shown even if not selected
        if (
          newMessage.senderId === authUser._id ||
          newMessage.receiverId === authUser._id
        ) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }

        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: prev[newMessage.senderId]
            ? prev[newMessage.senderId] + 1
            : 1,
        }));
      }
    });

    socket.on("typing", ({ from }) => {
      setIsTypingFrom(from);
    });
    socket.on("stop_typing", ({ from }) => {
      if (isTypingFrom === from) setIsTypingFrom(null);
    });
    socket.on("recording", ({ from }) => {
      setIsRecordingFrom(from);
    });
    socket.on("stop_recording", ({ from }) => {
      if (isRecordingFrom === from) setIsRecordingFrom(null);
    });
    
  };

  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("recording");
      socket.off("stop_recording");
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    getMessages,
    users,
    setUsers,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    sendMessage,
    getUsers,
    isTypingFrom,
    isRecordingFrom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
