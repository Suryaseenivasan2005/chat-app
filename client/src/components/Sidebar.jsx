import React, { useContext, useState, useEffect } from 'react';
import assets from '../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import img99 from '../assets/img99.jpeg';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import { NotificationContext } from '../../context/NotificationContext';
import InviteModal from './InviteModal';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessages = {} } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const { notifications, setShowNotificationModal } = useContext(NotificationContext);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = input
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;
  const hasFriends = users.filter(u => !u.isBot).length > 0;

  return (
    <div className={`bg-[#8185B2]/10 h-full flex flex-col rounded-r-xl text-white relative ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className="flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={img99} alt="logo" className="max-w-10 rounded-xl cursor-pointer" onClick={() => navigate('/friends/request')} />
          <p>Vetti Pechu</p>
          <div className="flex items-center gap-2">
            {/* Mail Icon for Notifications */}
            <div className="relative">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E"
                alt="notifications" 
                className="w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity" 
                onClick={() => setShowNotificationModal(true)}
              />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{notifications.length}</span>
                </div>
              )}
            </div>
            
            {/* Menu Icon */}
            <div className="relative py-2">
              <img 
                src={assets.menu_icon} 
                alt="menu" 
                className="max-h-7 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              />
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  ></div>
                  <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100">
                    <p onClick={() => {
                      navigate('/profile');
                      setShowMenu(false);
                    }} className='cursor-pointer text-sm'>Edit Profile</p>
                    <hr className="my-2 border-t border-gray-500" />
                    <p onClick={() => {
                      navigate('/groups/create');
                      setShowMenu(false);
                    }} className='cursor-pointer text-sm'>Create Group</p>
                    <hr className="my-2 border-t border-gray-500" />
                    <p onClick={() => {
                      logout();
                      setShowMenu(false);
                    }} className='cursor-pointer text-sm'>Logout</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <img src={assets.search_icon} alt="search" className="w-5" />
          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder='Search User...'
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex flex-col flex-1">
        {filteredUsers.filter(user => !user.isBot).map((user, index) => (
          <div
            onClick={() => setSelectedUser(user)}
            key={index}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm
              ${selectedUser?._id === user._id ? 'bg-[#282142]/50' : ''}
            `}
          >
            <div className="relative w-[44px] h-[44px]">
              <img
                src={user?.profilePic || assets.avatar_icon}
                alt={`${user.fullName}'s profile`}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  console.log('Profile pic load error:', e.target.src);
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = assets.avatar_icon;
                }}
              />
              {onlineUsers.includes(user._id) && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#282142] bg-green-500 transition-colors duration-300">
                </div>
              )}
            </div>
            <div className="flex flex-col leading-5">
              <p className="text-base font-medium">{user.fullName}</p>
              <span className={`text-sm transition-colors duration-300 ${
                onlineUsers.includes(user._id) 
                  ? 'text-green-400' 
                  : 'text-neutral-400'
              }`}>
                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              </span>
            </div>

            {unseenMessages?.[user._id] > 0 && (
              <div className='absolute top-2 right-2 h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white text-xs font-medium'>
                {unseenMessages[user._id]}
              </div>
            )}
          </div>
        ))}
        {/* Groups */}
        {/* groups are mixed into users now */}
      </div>

      </div>
      {/* Bot Button - Pinned above bottom section */}
      <div className="relative">
        {/* Bot Button floating above bottom section */}
        <div
          onClick={() => {
            const botUser = users.find(user => user.isBot);
            if (botUser) setSelectedUser(botUser);
          }}
          className="absolute bottom-20 right-4 z-10 cursor-pointer hover:scale-110 transition-transform duration-300"
        >
          <div className="relative w-20 cursor-pointer hover:transform hover:scale-110 transition-all duration-300">
            <img 
              src={assets.hiHeyGif}
              alt="Bot Assistant"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            {unseenMessages?.[users.find(user => user.isBot)?._id] > 0 && (
              <div className='absolute -top-1 -right-1 h-5 w-5 flex justify-center items-center rounded-full bg-red-500 text-white text-xs font-medium border-2 border-[#282142]'>
                {unseenMessages[users.find(user => user.isBot)?._id]}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Section */}
        <div className="sticky bottom-0 w-full bg-[#8185B2]/10 p-4 flex gap-2 border-t border-[#282142]">
          {/* Add Friend Button - compact */}
          <button
            onClick={() => navigate('/friends/request')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-green-700 transition-colors duration-300 shadow-lg"
          >
            <span className="text-white text-sm font-medium">Add Friend</span>
            <span className="text-white text-lg">+</span>
          </button>

          {/* Invite Friends Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 transition-colors duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-white text-sm font-medium">Invite</span>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
    </div>
  );
};

export default Sidebar;
