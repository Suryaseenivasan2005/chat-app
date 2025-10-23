import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import assets from '../assets/assets.js';

const GroupCreatePage = () => {
  const { axios } = useContext(AuthContext);
  const { users } = useContext(ChatContext);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);

  const toggleMember = (id) => {
    setMembers((prev) => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const create = async () => {
    await axios.post('/api/groups', { name, members });
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5/6 max-w-md backdrop-blur-2xl text-gray-300 border-2 border-gray-600 rounded-lg p-6">
        <h3 className="mb-3">Create Group</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full mb-3 bg-transparent border border-gray-600 rounded px-2 py-1" />
        <div className="max-h-64 overflow-y-auto space-y-2">
          {users.map(u => (
            <label key={u._id} className="flex items-center gap-2">
              <input type="checkbox" checked={members.includes(u._id)} onChange={() => toggleMember(u._id)} />
              <img src={u.profilePic || assets.avatar_icon} className="w-6 h-6 rounded-full" />
              <span className="text-xs">{u.fullName}</span>
            </label>
          ))}
        </div>
        <button onClick={create} className="mt-4 bg-gradient-to-r from-purple-400 to-violet-600 text-white px-4 py-1 rounded-full">Create</button>
      </div>
    </div>
  );
};

export default GroupCreatePage;


