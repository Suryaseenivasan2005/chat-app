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

function DemoBanner({ createdAt }) {
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

  const isUrgent = timeLeft !== null && timeLeft < 3 * 60 * 1000; // Last 3 minutes

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-center gap-3 text-xs font-semibold text-white z-50 transition-colors duration-700 ${isUrgent ? 'bg-gradient-to-r from-red-600/80 to-orange-600/80' : 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80'} backdrop-blur-sm`}>
      <span>🔒 Demo Mode</span>
      <span className="text-white/60 font-normal hidden sm:inline">—</span>
      <span className="hidden sm:inline text-white/70 font-normal">Session expires in</span>
      <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-orange-200 animate-pulse' : 'text-purple-200'}`}>
        {timeLeft !== null ? formatTimeLeft(timeLeft) : '--:--'}
      </span>
      <button
        onClick={() => navigate('/login')}
        className="ml-2 bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-lg transition-all"
      >
        Sign in →
      </button>
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
    <div className="flex flex-col w-full h-screen">
      {authUser?.isDemo && <DemoBanner createdAt={authUser.createdAt} />}
      <div
        className="flex-1 bg-cover bg-center flex items-center justify-center overflow-hidden"
        style={bgStyle || { backgroundImage: "url('/bgImage.svg')" }}
      >
        <div
          className={`w-full h-full max-w-6xl rounded-2xl overflow-hidden shadow-lg border border-gray-600 backdrop-blur-xl grid
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
    </div>
  );
}

export default HomePage;

