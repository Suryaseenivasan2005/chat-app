import React, { useContext, useEffect, useState } from 'react';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import assets from '../assets/assets.js';

const ShareModal = ({ message, onClose }) => {
  const { users, setSelectedUser, sendMessage } = useContext(ChatContext);
  const { authUser } = useContext(AuthContext);
  const [filter, setFilter] = useState('');

  const list = users.filter(u => u._id !== authUser._id && u.fullName.toLowerCase().includes(filter.toLowerCase()));

  const forward = async (user) => {
    setSelectedUser(user);
    if (message.text) await sendMessage({ text: message.text });
    if (message.image) await sendMessage({ image: message.image });
    if (message.audio) await sendMessage({ audio: message.audio });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#282142] border border-gray-600 rounded-lg w-80 p-4 text-white">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm">Forward message</h4>
          <button onClick={onClose} className="text-xs opacity-70">Close</button>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search users"
          className="w-full text-sm bg-transparent border border-gray-600 rounded px-2 py-1 mb-3 outline-none"
        />
        <div className="max-h-60 overflow-y-auto space-y-2">
          {list.map(u => (
            <button key={u._id} onClick={() => forward(u)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10">
              {u.isBot ? (
                <img src={assets.Chitti} alt="Bumble Bee" className="w-6 h-6 rounded-full object-cover" />
              ) : u.profilePic ? (
                <img src={u.profilePic} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {u.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs">{u.fullName}</span>
            </button>
          ))}
          {list.length === 0 && <div className="text-xs opacity-70">No matches</div>}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;


