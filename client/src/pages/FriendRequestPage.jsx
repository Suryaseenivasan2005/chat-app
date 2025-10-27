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

  return (
    <div className="bg-[#8185B2]/10 min-h-screen flex flex-col text-white">
      {/* Fixed Header */}
      <div className="bg-[#282142] p-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:text-gray-300"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">Add Friends</h1>
      </div>

      {/* Fixed Search Bar */}
      <div className="sticky top-[72px] z-10 bg-[#8185B2]/10 p-4">
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4">
          <img src={assets.search_icon} alt="search" className="w-5" />
          <input
            onChange={(e) => setSearchInput(e.target.value)}
            type="text"
            placeholder="Search users..."
            className="bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1"
          />
        </div>
      </div>

      {/* Scrollable Users List */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-4 bg-[#282142]/50 rounded-lg hover:bg-[#282142]/70 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#8185B2]/20">
                  <img
                    src={user.profilePic || assets.avatar_icon}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = assets.avatar_icon;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{user.fullName}</h3>
                  <p className="text-sm text-gray-400 truncate">{user.bio || 'No bio available'}</p>
                </div>
                {user.friendshipStatus === 'pending' || user.sentByMe ? (
                  <button className="bg-gray-400 text-white px-6 py-2 rounded-full text-sm font-medium cursor-not-allowed flex-shrink-0">
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(user._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestPage;
