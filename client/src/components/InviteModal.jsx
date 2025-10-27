import React, { useState } from 'react';
import toast from 'react-hot-toast';

const InviteModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareViaSystem = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Vetti Pechu',
          text: 'Hey! Join me on Vetti Pechu for real-time messaging.',
          url: inviteLink
        });
      } else {
        copyLink();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#282142] border border-gray-600 rounded-lg w-80 p-4 text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium">Invite Friends</h4>
          <button onClick={onClose} className="text-xs opacity-70">Close</button>
        </div>
        
        <div className="mb-4">
          <p className="text-xs text-gray-300 mb-2">Share this link with your friends to invite them:</p>
          <div className="flex items-center gap-2 bg-[#1e1932] p-2 rounded">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-transparent text-xs outline-none"
            />
            <button
              onClick={copyLink}
              className={`text-xs px-3 py-1 rounded ${
                copied ? 'bg-green-600' : 'bg-violet-600 hover:bg-violet-700'
              } transition-colors duration-300`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={shareViaSystem}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-colors duration-300 py-2 rounded text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Invite Link
        </button>
      </div>
    </div>
  );
};

export default InviteModal;