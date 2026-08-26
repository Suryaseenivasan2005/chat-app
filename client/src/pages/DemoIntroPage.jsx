import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

export default function DemoIntroPage() {
  const { loginDemo, authUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // 'checking' | 'ready' | 'error'
  const [retryCount, setRetryCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (authUser) navigate('/', { replace: true });
  }, [authUser, navigate]);

  // Poll backend readiness (handles cold starts)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const check = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/status`, { timeout: 8000 });
        if (res.status === 200) {
          setStatus('ready');
          clearInterval(pollRef.current);
        }
      } catch {
        attempts++;
        setRetryCount(attempts);
        if (attempts >= maxAttempts) {
          setStatus('error');
          clearInterval(pollRef.current);
        }
      }
    };

    check();
    pollRef.current = setInterval(check, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    await loginDemo();
    setIsStarting(false);
  };

  // ── Cold-start loader ──────────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-5">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-purple-900 border-t-purple-400 animate-spin" />
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Waking up the server…</p>
          <p className="text-gray-500 text-xs mt-1">
            {retryCount > 0 ? `Attempt ${retryCount} of 20` : 'Connecting…'}
          </p>
        </div>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 rounded-full"
            style={{ width: `${Math.min((retryCount / 20) * 100, 95)}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-4xl">⚠️</p>
        <p className="text-white font-bold text-lg">Server Unavailable</p>
        <p className="text-gray-400 text-sm max-w-xs">Could not reach the server after 60 s. It may be down.</p>
        <button
          onClick={() => { setStatus('checking'); setRetryCount(0); }}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Intro Card ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a2e] bg-[url('/bgImage.svg')] bg-contain flex items-center justify-center px-4">
      <div className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Talklet — Live Demo
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">No sign-up · Resets in 15 min · Isolated sandbox</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Online
            </span>
          </div>

          {/* Two-column bullets */}
          <div className="grid grid-cols-2 gap-2 mb-7">
            {[
              ['💬', 'Chat with 3 sample users'],
              ['🤖', 'AI bot (Bumble Bee) included'],
              ['🎙️', 'Send voice messages'],
              ['📸', 'Share images in chat'],
              ['🔔', 'Live online presence'],
              ['🔒', 'Your data auto-wiped at end'],
              ['🚫', 'Calls require sign-in'],
              ['⏱️', '15-minute session timer'],
            ].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              id="demo-start-btn"
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up…
                </>
              ) : '🚀 Start Demo'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-3 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              Sign in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
