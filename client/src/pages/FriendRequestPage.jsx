import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import assets from '../assets/assets.js';
import toast from 'react-hot-toast';

const FriendRequestPage = () => {
  const { axios, authUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Try friends endpoint first, fallback to users endpoint
      let response;
      try {
        response = await axios.get('/api/friends/all');
      } catch (friendsError) {
        response = await axios.get('/api/users/all');
      }

      if (response.data.success) {
        // Filter out current user and bot and already accepted friends
        const filteredUsers = response.data.users.filter(user =>
          user._id !== authUser._id && !user.isBot && user.friendshipStatus !== 'accepted'
        );
        setUsers(filteredUsers);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const { data } = await axios.post(`/api/friends/request/${userId}`);
      if (data.success) {
        // Update UI immediately to show request sent
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, friendshipStatus: 'pending', sentByMe: true } : u));
        toast.success('Friend request sent!');
      } else {
        toast.error(data.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error.message);
      toast.error('Failed to send friend request');
    }
  };

  const filteredUsers = searchInput
    ? users.filter((user) => user.fullName.toLowerCase().includes(searchInput.toLowerCase()))
    : users;

  // Helper to safely get profile image URL (handles string or object shapes)
  const getProfilePic = (user) => {
    if (!user) return assets.avatar_icon;
    const pic = user.profilePic;
    if (!pic) return `https://avatar.iran.liara.run/username?username=${encodeURIComponent(user.fullName)}`;
    // string cases
    if (typeof pic === 'string') {
      // already a data URI
      if (pic.startsWith('data:')) return pic;
      // absolute URL
      if (pic.startsWith('http')) return pic;
      // relative path served from the same origin
      if (pic.startsWith('/')) return `${window.location.origin}${pic}`;
      // fallback - return as-is (might be a protocol-relative or missing scheme)
      return pic;
    }
    // object cases: cloudinary upload responses or { url: '' }
    if (pic.url) return pic.url;
    if (pic.secure_url) return pic.secure_url;
    if (pic.path) return `${window.location.origin}${pic.path}`;
    if (pic.src) return pic.src;
    return `https://avatar.iran.liara.run/username?username=${encodeURIComponent(user.fullName)}`;
  };

  return (
    <div className={`bg-[#8185B2]/10 min-h-screen flex flex-col text-white`}>
      <div className="flex-1 overflow-y-auto p-5">
        {/* Header (same as Sidebar) */}
        <div className="pb-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-white hover:text-gray-300"
              >
                ← Back
              </button>
              <img src={assets.img99} alt="" className="max-w-10 rounded-xl cursor-pointer" onClick={() => navigate('/friends/request')} />
            </div>
            {/* top-right icons removed as requested */}
          </div>

          {/* Search Bar */}
          <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
            <img src={assets.search_icon} alt="search" className="w-5" />
            <input
              onChange={(e) => setSearchInput(e.target.value)}
              type="text"
              placeholder='Search User...'
              className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            />
          </div>
        </div>

        {/* Users List - same row style as Sidebar */}
        <div className="flex flex-col flex-1">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm hover:bg-[#282142]/40"
              >
                <div className="relative w-[44px] h-[44px]">
                  <img
                    src={getProfilePic(user)}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.target.src = assets.avatar_icon; }}
                  />
                </div>
                <div className="flex flex-col leading-5">
                  <p className="text-base font-medium">{user.fullName}</p>
                  <span className={`text-sm text-gray-400 max-w-[180px] truncate`}>
                    {user.bio ? user.bio : 'No bio available'}
                  </span>
                </div>

                <div className='absolute top-2 right-2'>
                  {user.friendshipStatus === 'pending' || user.sentByMe ? (
                    <button className="bg-gray-400 text-white px-4 py-1 rounded-full text-sm font-medium cursor-not-allowed">
                      Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(user._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm font-medium transition-all duration-300"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Bottom area removed per request */}
    </div>
  );
};

export default FriendRequestPage;
