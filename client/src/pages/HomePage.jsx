import React, { useContext, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Chatbox from '../components/Chatbox.jsx';
import RightSidebar from '../components/RightSidebar.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Formats milliseconds remaining into mm:ss
function formatTimeLeft(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const DEMO_DURATION_MS = 15 * 60 * 1000;

// Small fixed pill timer — top-right, no interactions
function DemoTimerPill({ createdAt }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const sessionStart = new Date(createdAt).getTime();
    const tick = () => {
      const left = DEMO_DURATION_MS - (Date.now() - sessionStart);
      setTimeLeft(left);
      if (left <= 0) {
        logout();
        navigate('/demo');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const isUrgent = timeLeft !== null && timeLeft < 3 * 60 * 1000;

  return (
    <div
      className={`fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-lg pointer-events-none select-none transition-colors duration-700
        ${isUrgent
          ? 'bg-red-600/80 text-orange-100 shadow-red-900/40'
          : 'bg-black/50 text-purple-200 border border-purple-500/30 shadow-black/40'
        } backdrop-blur-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-orange-300 animate-pulse' : 'bg-purple-400'}`} />
      {timeLeft !== null ? formatTimeLeft(timeLeft) : '--:--'}
    </div>
  );
}

function HomePage() {
  const { selectedUser } = useContext(ChatContext);
  const { authUser } = useContext(AuthContext);

  const bgStyle = authUser?.backgroundImage
    ? { backgroundImage: `url(${authUser.backgroundImage})` }
    : undefined;

  return (
    <div
      className="w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={bgStyle || { backgroundImage: "url('/bgImage.svg')" }}
    >
      {/* Fixed demo timer pill — top-right, non-interactive */}
      {authUser?.isDemo && <DemoTimerPill createdAt={authUser.createdAt} />}

      <div
        className={`w-full h-[90vh] max-w-6xl rounded-2xl overflow-hidden shadow-lg border border-gray-600 backdrop-blur-xl grid
          ${selectedUser
            ? 'grid-cols-1 md:grid-cols-[1fr_2fr_1fr]'
            : 'grid-cols-1 md:grid-cols-[1fr_2fr]'
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

