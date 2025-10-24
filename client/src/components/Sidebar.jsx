import React, { useContext, useState, useEffect } from 'react';
import assets from '../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import img99 from '../assets/img99.jpeg';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessages = {} } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = input
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  return (
    <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ""}`}>
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={img99} alt="logo" className="max-w-10 rounded-xl" />
          <p>Vetti Pechu</p>
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
      <div className="flex flex-col">
        {filteredUsers.map((user, index) => (
          <div
            onClick={() => setSelectedUser(user)}
            key={index}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm
              ${selectedUser?._id === user._id ? 'bg-[#282142]/50' : ''}
            `}
          >
            <div className="relative w-[35px] h-[35px]">
              <img
                src={user?.isBot ? assets.Chitti : (user?.profilePic || assets.avatar_icon)}
                alt={`${user.fullName}'s profile`}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  console.log('Profile pic load error:', e.target.src);
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = assets.avatar_icon;
                }}
              />
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#282142] ${
                onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
            </div>
            <div className="flex flex-col leading-5">
              <p>
                {user.isBot ? '🤖 ' : ''}
                {user.fullName}
              </p>
              {!user.isBot && (
                onlineUsers.includes(user._id)
                  ? <span className='text-green-400 text-xs' style={{color: '#90EE90'}}>Online</span>
                  : <span className='text-neutral-400 text-xs'>Offline</span>
              )}
            </div>

            {unseenMessages?.[user._id] > 0 && (
              <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
        {/* Groups */}
        {/* groups are mixed into users now */}
      </div>
    </div>
  );
};

export default Sidebar;
