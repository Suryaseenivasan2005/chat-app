import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets';
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';

const PublicDirectory = () => {
  const { axios, authUser, onlineUsers } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchPublic = async (search = '', pageNum = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/public?q=${encodeURIComponent(search)}&page=${pageNum}&limit=${limit}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
      } else {
        toast.error(res.data.message || 'Failed to fetch public users');
      }
    } catch (err) {
      console.error('Public fetch error', err.message);
      toast.error('Failed to load public users');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced = useCallback(debounce((val) => {
    setPage(1);
    fetchPublic(val, 1);
  }, 300), []);

  useEffect(() => {
    fetchPublic(q, page);
  }, []);

  useEffect(() => {
    debounced(q);
  }, [q]);

  const handleSendMessage = (user) => {
    // navigate to chat or set selected user depending on app structure
    toast('Open chat with ' + user.fullName);
  };

  const handleAddFriend = async (userId) => {
    try {
      const { data } = await axios.post(`/api/friends/request/${userId}`);
      if (data.success) {
        toast.success(data.message || 'Friend request sent');
        // Optimistic update
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, friendshipStatus: 'pending', sentByMe: true } : u));
      } else {
        toast.error(data.message || 'Failed to send');
      }
    } catch (error) {
      console.error('Add friend failed', error.message);
      toast.error('Failed to add friend');
    }
  };

  return (
    <div className="min-h-screen p-6 text-white bg-[#0f1724]/20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl mb-4">Public Directory</h2>
        <div className="flex items-center gap-3 mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search public users..." className="flex-1 p-2 rounded bg-[#1f2937]/60" />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-400">No public users found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user._id} className="bg-[#111827] p-4 rounded-lg flex items-center gap-4">
                <img src={user.profilePic || assets.avatar_icon} alt={user.fullName} className="w-14 h-14 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-gray-400">{user.isPublic ? 'Public' : 'Private'}</div>
                    </div>
                    <div className="text-sm text-gray-400">{onlineUsers.includes(user._id) ? 'Online' : 'Offline'}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleSendMessage(user)} className="px-3 py-1 bg-indigo-600 rounded">Message</button>
                    {user.friendshipStatus === 'pending' || user.sentByMe ? (
                      <button className="px-3 py-1 bg-gray-500 rounded">Request Sent</button>
                    ) : (
                      <button onClick={() => handleAddFriend(user._id)} className="px-3 py-1 bg-blue-600 rounded">Add Friend</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDirectory;
