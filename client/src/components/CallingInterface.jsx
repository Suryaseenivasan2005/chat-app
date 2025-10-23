import React, { useContext } from 'react';
import { CallingContext } from '../../context/CallingContext.jsx';
import assets from '../assets/assets.js';

const CallingInterface = () => {
  const {
    isInCall,
    callData,
    callStatus,
    callDuration,
    isMuted,
    isSpeakerOn,
    isVideoOn,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    formatTime,
    remoteAudio,
    remoteVideo,
    localVideo
  } = useContext(CallingContext);

  // Check if this is a direct video call
  const isDirectVideoCall = callData?.isVideoCall;

  if (!isInCall || !callData) return null;

  const isIncoming = callData.caller._id !== callData.receiver._id;
  const otherUser = isIncoming ? callData.caller : callData.receiver;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className={`bg-gradient-to-b from-[#282142] to-[#1a1630] border border-gray-600 rounded-2xl p-8 text-white flex flex-col items-center ${
        isDirectVideoCall ? 'w-[800px] h-[600px]' : 'w-[500px]'
      }`}>
        
        {/* Video Display Area */}
        <div className={`relative w-full rounded-lg overflow-hidden bg-gray-800 ${
          isDirectVideoCall ? 'h-96 mb-6' : 'h-64 mb-6'
        }`}>
          {/* Remote Video */}
          <video 
            ref={remoteVideo} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
            style={{ display: isVideoOn ? 'block' : 'none' }}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <video 
            ref={localVideo} 
            autoPlay 
            playsInline 
            muted
            className="absolute top-4 right-4 w-24 h-32 object-cover rounded-lg border-2 border-white/30"
            style={{ display: isVideoOn ? 'block' : 'none' }}
          />
          
          {/* Fallback Profile Picture when video is off */}
          {!isVideoOn && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative">
                <img 
                  src={otherUser?.profilePic || assets.avatar_icon} 
                  alt={otherUser.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/30" 
                  onError={(e) => { e.target.src = assets.avatar_icon }}
                />
                {!otherUser?.profilePic && (
                  <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center text-4xl text-white border-4 border-purple-500/30">
                    {otherUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Name */}
        <h3 className="text-2xl font-semibold mb-2">{otherUser.fullName}</h3>
        
        {/* Call Status */}
        <p className="text-gray-300 mb-4 text-center">
          {callStatus === 'calling' ? 'Calling...' : 
           callStatus === 'ringing' ? 'Incoming call' : 
           callStatus === 'connected' ? 'Call in progress' : 'Call ended'}
        </p>
        
        {/* Call Timer */}
        {callStatus === 'connected' && (
          <div className="text-xl font-medium mb-6 text-white">
            {formatTime(callDuration)}
          </div>
        )}
        
        {/* Audio element for remote stream */}
        <audio ref={remoteAudio} autoPlay />
        
        {/* Call Controls */}
        <div className="flex gap-6 mt-4">
          {/* Incoming Call Controls */}
          {callStatus === 'ringing' && isIncoming && (
            <>
              <button 
                onClick={() => rejectCall(callData)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-5 shadow-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                  <line x1="23" y1="1" x2="1" y2="23"></line>
                </svg>
              </button>
              
              <button 
                onClick={() => acceptCall(callData)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full p-5 shadow-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
            </>
          )}
          
          {/* End Call Button (for caller or during connected call) */}
          {(callStatus === 'calling' || callStatus === 'connected') && (
            <button 
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-5 shadow-lg transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                <line x1="23" y1="1" x2="1" y2="23"></line>
              </svg>
            </button>
          )}
        </div>
        
        {/* Additional Controls for Connected Call */}
        {callStatus === 'connected' && (
          <div className="flex gap-4 mt-6">
            {/* Mute Button */}
            <button 
              onClick={toggleMute}
              className={`${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-full p-3 transition-all duration-200`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMuted ? (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </>
                ) : (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </>
                )}
              </svg>
            </button>
            
            {/* Camera Toggle Button - Show as "Add Video" when off, "Turn Off Video" when on */}
            <button 
              onClick={toggleVideo}
              className={`${!isVideoOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-full p-3 transition-all duration-200`}
              title={!isVideoOn ? 'Turn on camera' : 'Turn off camera'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {!isVideoOn ? (
                  // Camera icon for turning on video
                  <>
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </>
                ) : (
                  // Camera off icon for turning off video
                  <>
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </>
                )}
              </svg>
            </button>
            
            {/* Speaker Button */}
            <button 
              onClick={toggleSpeaker}
              className={`${!isSpeakerOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-full p-3 transition-all duration-200`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {!isSpeakerOn ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="1" x2="1" y2="23"></line>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </>
                )}
              </svg>
            </button>
          </div>
        )}
        
        {/* Call Info */}
        <div className="text-xs text-gray-400 mt-8 text-center">
          {callStatus === 'connected' && `${isVideoOn ? 'Video' : 'Voice'} call • End-to-end encrypted`}
        </div>
      </div>
    </div>
  );
};

export default CallingInterface;
