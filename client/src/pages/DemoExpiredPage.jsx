import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function DemoExpiredPage({ onNewDemo }) {
  const navigate = useNavigate();
  const { setDemoExpired } = useContext(AuthContext);

  const handleNewDemo = () => {
    setDemoExpired(false);
    navigate('/demo', { replace: true });
  };

  const handleSignIn = () => {
    setDemoExpired(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f1a]/95 backdrop-blur-xl px-4">
      <div className="w-full max-w-sm">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Top red accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-xl font-bold text-white mb-2">Demo Session Ended</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-7">
              Your 15-minute Talklet demo has ended. All temporary data has been wiped.
              Start a new demo or sign in to continue.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                id="demo-expired-signin"
                onClick={handleSignIn}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/30 transition-all active:scale-[0.98]"
              >
                Sign In
              </button>
              <button
                id="demo-expired-new-demo"
                onClick={handleNewDemo}
                className="w-full py-2.5 border border-white/10 hover:border-purple-500/40 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                Start New Demo
              </button>
              <a
                href="https://talklet.app/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-gray-500 hover:text-gray-300 text-xs py-1 transition-colors"
              >
                Create Account →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
