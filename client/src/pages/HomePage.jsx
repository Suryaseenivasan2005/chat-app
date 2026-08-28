import React, { useContext, useState, useEffect, useRef } from 'react';
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

/**
 * DemoTimerBar — fixed pill in top-right showing DEMO • MM:SS [RESET]
 *
 * Timer is driven by demoExpiresAt (epoch ms, from server JWT).
 * On expiry → calls handleDemoExpired() which shows the DemoExpiredPage overlay.
 */
function DemoTimerBar() {
  const { demoExpiresAt, handleDemoExpired, resetDemo } = useContext(AuthContext);
  const { setSelectedUser, setUsers } = useContext(ChatContext);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!demoExpiresAt) return;

    const tick = () => {
      const left = demoExpiresAt - Date.now();
      setTimeLeft(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        handleDemoExpired();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [demoExpiresAt]);

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    // Clear selected conversation so the sidebar re-fetches
    setSelectedUser(null);
    setUsers([]);
    const ok = await resetDemo();
    setIsResetting(false);
    if (ok) {
      // Reload users in sidebar via page navigation (soft)
      navigate(0);
    }
  };

  const isUrgent = timeLeft !== null && timeLeft < 3 * 60 * 1000;
  const isAlmostGone = timeLeft !== null && timeLeft < 60 * 1000;

  return (
    <div
      className={`fixed top-3 right-3 z-50 flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xl transition-all duration-700
        ${isAlmostGone
          ? 'bg-red-700/90 text-orange-100 shadow-red-900/50 animate-pulse'
          : isUrgent
          ? 'bg-red-600/80 text-orange-100 shadow-red-900/40'
          : 'bg-black/60 text-purple-200 border border-purple-500/30 shadow-black/40'
        } backdrop-blur-sm`}
    >
      {/* Dot + label */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUrgent ? 'bg-orange-300 animate-pulse' : 'bg-purple-400'}`} />
      <span className="tracking-wide">DEMO</span>
      <span className="text-gray-400 font-normal">•</span>
      <span className={`tabular-nums ${isAlmostGone ? 'text-red-200' : ''}`}>
        {timeLeft !== null ? formatTimeLeft(timeLeft) : '--:--'}
      </span>

      {/* RESET button */}
      <button
        id="demo-reset-btn"
        onClick={handleReset}
        disabled={isResetting}
        className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all pointer-events-auto select-none border border-white/10"
        title="Reset demo — wipes changes and restarts 15-min timer"
      >
        {isResetting ? '…' : 'Reset'}
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
    <div
      className="w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={bgStyle || { backgroundImage: "url('/bgImage.svg')" }}
    >
      {/* Demo timer bar — visible only for demo users */}
      {authUser?.isDemo && <DemoTimerBar />}

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
