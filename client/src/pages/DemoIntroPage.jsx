import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

// Feature bullets for the demo intro card
const DEMO_FEATURES = [
  { icon: '💬', label: 'Real-time messaging with Bumble Bee (AI Bot)' },
  { icon: '😀', label: 'Emoji & GIF reactions in chat' },
  { icon: '🎙️', label: 'Voice messages' },
  { icon: '📸', label: 'Image sharing in chat' },
  { icon: '🔔', label: 'Live online presence indicators' },
  { icon: '👤', label: 'View profile page (editing disabled in demo)' },
];

const DEMO_NOTICES = [
  '⏱️ Your session automatically ends after 15 minutes',
  '🔒 All data you send is wiped when the session expires',
  '🤖 You are isolated to Bumble Bee — no real users are visible',
  '🚫 Profile edits & sensitive features require sign-in',
];

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

// Animated pulsing dot
const PulseDot = () => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
  </span>
);

export default function DemoIntroPage() {
  const { loginDemo, authUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // States: 'checking' | 'ready' | 'error' | 'loading'
  const [status, setStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef(null);

  // If user is already logged in (demo or real), redirect home
  useEffect(() => {
    if (authUser) navigate('/', { replace: true });
  }, [authUser, navigate]);

  // Backend readiness check with polling for cold starts
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3s = 60s max wait

    const checkBackend = async () => {
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

    checkBackend(); // Immediate first check
    pollRef.current = setInterval(checkBackend, 3000);

    return () => clearInterval(pollRef.current);
  }, []);

  const handleStartDemo = async () => {
    setIsStarting(true);
    await loginDemo();
    setIsStarting(false);
  };

  // ─── Cold-start loading screen ────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative">
          {/* Spinner rings */}
          <div className="w-20 h-20 rounded-full border-4 border-purple-900 border-t-purple-500 animate-spin" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-b-indigo-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Waking up the server…</h2>
          <p className="text-gray-400 text-sm">
            {retryCount === 0
              ? 'Connecting to Talklet backend…'
              : `Still warming up — attempt ${retryCount} of 20`}
          </p>
          <p className="text-gray-600 text-xs">Free-tier servers sleep when idle. This may take up to 60 seconds.</p>
        </div>
        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((retryCount / 20) * 100, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // ─── Error / unreachable screen ───────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-white">Server Unavailable</h2>
        <p className="text-gray-400 max-w-sm">
          The Talklet server could not be reached after 60 seconds. It may be experiencing downtime.
        </p>
        <button
          onClick={() => { setStatus('checking'); setRetryCount(0); }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ─── Demo Intro Card ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1a2e] bg-[url('/bgImage.svg')] bg-contain flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Glowing background blob */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

          {/* Header gradient strip */}
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

          <div className="p-8 space-y-7">

            {/* Logo + title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs text-purple-300 font-semibold tracking-wider mb-1">
                <PulseDot />
                SERVER ONLINE
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Talklet Demo
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Explore the full chat experience — no sign-up required.
                Your sandbox session lasts <span className="text-purple-400 font-semibold">15 minutes</span>.
              </p>
            </div>

            {/* What's in the demo */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">What you can explore</h3>
              <ul className="space-y-2">
                {DEMO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-2.5 border border-white/5">
                    <span className="text-lg">{f.icon}</span>
                    <span className="text-sm text-gray-200">{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Notices */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Good to know</h3>
              <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-4 space-y-2">
                {DEMO_NOTICES.map((n, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed">{n}</p>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              id="demo-start-btn"
              onClick={handleStartDemo}
              disabled={isStarting}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-base shadow-xl shadow-purple-900/30 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting Demo…
                </>
              ) : (
                <>
                  🚀 Continue to Demo
                </>
              )}
            </button>

            {/* Sign-in nudge */}
            <p className="text-center text-xs text-gray-600">
              Want the full experience?{' '}
              <span
                className="text-purple-400 cursor-pointer hover:text-purple-300 font-semibold transition-colors"
                onClick={() => navigate('/login')}
              >
                Sign up free →
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
