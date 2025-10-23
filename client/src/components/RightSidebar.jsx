import React, { useContext, useEffect } from 'react';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import assets from '../assets/assets.js';
import { CallingContext } from '../../context/CallingContext.jsx';
import toast from 'react-hot-toast';
import video_call from '../assets/video_call.png';

const RightSidebar = ({ selectedUser }) => {
  const { messages, sendMessage } = useContext(ChatContext);
  const { onlineUsers, authUser } = useContext(AuthContext);
  const { initiateCall, initiateVideoCall, isInCall } = useContext(CallingContext);

  const mediaMessages = messages.filter(msg => msg.image);
  const isGroup = selectedUser?.isGroup;
  
  const handleCall = async () => {
    if (isGroup) {
      toast.error("Voice calls are not available for groups");
      return;
    }
    
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("User is offline");
      return;
    }
    
    await initiateCall(selectedUser);
  };

  const handleVideoCall = async () => {
    if (isGroup) {
      toast.error("Video calls are not available for groups");
      return;
    }
    
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("User is offline");
      return;
    }
    
    await initiateVideoCall(selectedUser);
  };

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      {/* Profile Section */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img 
          src={selectedUser?.isBot ? assets.Chitti : (selectedUser?.profilePic || assets.avatar_icon)} 
          alt="" 
          className="w-20 aspect-[1/1] rounded-full object-cover" 
          onError={(e) => { e.target.src = assets.avatar_icon }}
        />
        {!selectedUser?.profilePic && !selectedUser?.isBot && (
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl text-white absolute">
            {selectedUser.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
          {!isGroup && onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
          {selectedUser.fullName}
        </h1>
        <p className="px-10 mx-auto">{selectedUser.bio}</p>
        
        {/* Call Buttons - Horizontal Layout */}
        {!selectedUser.isBot && !isGroup && (
          <div className="mt-2 flex gap-2">
            <button 
              onClick={handleCall}
              disabled={isInCall || !onlineUsers.includes(selectedUser._id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs ${
                onlineUsers.includes(selectedUser._id) && !isInCall
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <img 
                src={assets.phone_icon} 
                alt="Call" 
                className="w-4 h-4" 
                style={{ filter: 'invert(1)' }}
              />
              Call
            </button>
            <button 
              onClick={handleVideoCall}
              disabled={isInCall || !onlineUsers.includes(selectedUser._id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs ${
                onlineUsers.includes(selectedUser._id) && !isInCall
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <img 
                src={video_call} 
                alt="Video Call" 
                className="w-4 h-4" 
              />
              Video
            </button>
          </div>
        )}
      </div>

      {/* Media Section */}
      <hr className="border-[#ffffff50] my-4" />
      <div className="px-5 text-xs">
        <p>Media</p>
        <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
          {mediaMessages.map((msg, index) => (
            <div key={index} onClick={() => window.open(msg.image)} className="cursor-pointer rounded">
              <img src={msg.image} alt="" className="h-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      

      {/* Logout Button */}
      <button className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer">
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
