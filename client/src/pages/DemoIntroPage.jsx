import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
const DEMO_DURATION_MS = 15 * 60 * 1000;

// Format ms as MM:SS
function fmt(ms) {
  if (!ms || ms <= 0) return '15:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function DemoIntroPage() {
  const { authUser, initDemo, startDemo, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Backend readiness check
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'ready' | 'error'
  const [retryCount, setRetryCount] = useState(0);
  const pollRef = useRef(null);

  // Pending session (from /api/demo/init — timer NOT started yet)
  const [pendingSession, setPendingSession] = useState(null); // { token, userData, sessionId }
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [initError, setInitError] = useState(null);

  // If a real (non-demo) user lands on /demo, log them out silently so
  // the demo flow can proceed. Without this, they'd be instantly bounced
  // back to '/' and the /demo page would never appear.
  useEffect(() => {
    if (authUser && !authUser.isDemo) {
      logout();
      // logout() clears authUser — the page stays mounted and the demo
      // init flow runs normally once authUser becomes null.
    }
  }, [authUser]);

  // ── Poll backend readiness ────────────────────────────────────────────────
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const check = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/status`, { timeout: 8000 });
        if (res.status === 200) {
          setServerStatus('ready');
          clearInterval(pollRef.current);
        }
      } catch {
        attempts++;
        setRetryCount(attempts);
        if (attempts >= maxAttempts) {
          setServerStatus('error');
          clearInterval(pollRef.current);
        }
      }
    };

    check();
    pollRef.current = setInterval(check, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Initialize a pending session once server is ready ─────────────────────
  useEffect(() => {
    // Also wait until any real logged-in user has been fully logged out
    if (serverStatus !== 'ready' || pendingSession || isInitializing || (authUser && !authUser.isDemo)) return;

    const init = async () => {
      setIsInitializing(true);
      setInitError(null);
      const result = await initDemo();
      setIsInitializing(false);
      if (result.success) {
        setPendingSession(result);
      } else {
        setInitError(result.message || 'Failed to prepare demo environment');
      }
    };

    init();
  }, [serverStatus, authUser]);

  // ── CONTINUE DEMO click ───────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!pendingSession || isStarting) return;
    setIsStarting(true);
    const result = await startDemo(pendingSession.sessionId, pendingSession.token);
    setIsStarting(false);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setInitError(result.message || 'Failed to start demo');
    }
  };

  // ── Cold-start loader ─────────────────────────────────────────────────────
  if (serverStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-purple-900 border-t-purple-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Waking up the server…</p>
          <p className="text-gray-500 text-sm mt-1">
            {retryCount > 0 ? `Attempt ${retryCount} of 20` : 'Connecting…'}
          </p>
        </div>
        <div className="w-52 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 rounded-full"
            style={{ width: `${Math.min((retryCount / 20) * 100, 95)}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Server error ──────────────────────────────────────────────────────────
  if (serverStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-5 text-center px-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-white font-bold text-xl">Server Unavailable</p>
        <p className="text-gray-400 text-sm max-w-xs">Could not reach the server after 60 s. It may be down for maintenance.</p>
        <button
          onClick={() => { setServerStatus('checking'); setRetryCount(0); }}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-sm font-bold hover:opacity-90 transition-all text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Intro Card (timer NOT started) ────────────────────────────────────────
  const isReady = !!pendingSession && !isInitializing;

  return (
    <div className="min-h-screen bg-[#0f0f1a] bg-[url('/bgImage.svg')] bg-contain flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Top gradient accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500" />

          <div className="p-8">

            {/* Brand header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-2xl">💬</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-tight">
                  Talklet
                </h1>
              </div>
              <p className="text-purple-300 text-sm font-semibold tracking-widest uppercase">Interactive Demo</p>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-7">
              Explore Talklet using a preloaded demo environment with sample users,
              realistic conversations and Bumblebee AI. <strong className="text-white">No account required.</strong>
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {[
                ['💬', 'Chat with 6 sample users'],
                ['🤖', 'Bumblebee AI included'],
                ['⚡', 'Real-time messaging'],
                ['🎙️', 'Voice message support'],
                ['🔔', 'Live online presence'],
                ['🔒', 'Your data auto-wiped'],
                ['🚫', 'Calls require sign-in'],
                ['🔄', 'Reset at any time'],
              ].map(([icon, text], i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-300 py-1">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span className="text-gray-400">{text}</span>
                </div>
              ))}
            </div>

            {/* Timer display — static until CONTINUE is clicked */}
            <div className="flex flex-col items-center gap-1 mb-7">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Demo Time</p>
              <div className="text-5xl font-mono font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent tabular-nums">
                15:00
              </div>
              <p className="text-gray-600 text-xs mt-0.5">Timer starts when you click Continue</p>
            </div>

            {/* Error message */}
            {initError && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {initError}
                <button onClick={() => { setInitError(null); setPendingSession(null); }} className="ml-2 underline">Retry</button>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              <button
                id="demo-continue-btn"
                onClick={handleContinue}
                disabled={!isReady || isStarting}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isInitializing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Preparing environment…
                  </>
                ) : isStarting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting demo…
                  </>
                ) : (
                  '▶  Continue Demo'
                )}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                Sign in to my account →
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-gray-600 text-xs mt-5">
              Changes made during the demo are temporary and will be wiped after 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
