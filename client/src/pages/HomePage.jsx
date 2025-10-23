import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Chatbox from '../components/Chatbox.jsx';
import RightSidebar from '../components/RightSidebar.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

function HomePage() {
  const { selectedUser } = useContext(ChatContext);
  const { authUser } = useContext(AuthContext);

  const bgStyle = authUser?.backgroundImage
    ? { backgroundImage: `url(${authUser.backgroundImage})` }
    : undefined;

  return (
    <div className="w-full h-screen bg-cover bg-center flex items-center justify-center" style={bgStyle || { backgroundImage: "url('/bgImage.svg')" }}>
      <div
        className={`w-full h-[90vh] max-w-6xl rounded-2xl overflow-hidden shadow-lg border border-gray-600 backdrop-blur-xl grid
          ${selectedUser
            ? 'grid-cols-1 md:grid-cols-[1fr_2fr_1fr]' // ✅ Three-column layout
            : 'grid-cols-1 md:grid-cols-[1fr_2fr]'     // ✅ Two-column layout
          }`
        }
      >
        <Sidebar />
        <Chatbox />
        {selectedUser && <RightSidebar selectedUser={selectedUser} />}
      </div>
    </div>
  );
}

export default HomePage;
