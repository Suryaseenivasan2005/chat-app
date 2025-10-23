import React, { useState, useRef, useEffect, useContext } from 'react';
import ShareModal from './ShareModal.jsx';
import assets from '../assets/assets.js';
import img99 from '../assets/img99.jpeg';
import { formatMessageTime } from '../lib/util.js';
import { ChatContext } from '../../context/ChatContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { CallingContext } from '../../context/CallingContext.jsx';
import toast from 'react-hot-toast';
import share_icon from '../assets/share_icon.png';
import copy_icon from '../assets/copy_icon.png';
import video_call from '../assets/video_call.png'

const Chatbox = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, isTypingFrom, isRecordingFrom } = useContext(ChatContext);
  const { authUser, onlineUsers, socket } = useContext(AuthContext);
  const { initiateCall, initiateVideoCall, isInCall } = useContext(CallingContext);
  const scrollEnd = useRef();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [shareTarget, setShareTarget] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const chatAreaRef = useRef(null);
  const lastScrollTop = useRef(0);

  // Handle scroll to detect direction and show/hide header like WhatsApp
  useEffect(() => {
    const handleScroll = (e) => {
      if (!chatAreaRef.current) return;
      
      const scrollTop = chatAreaRef.current.scrollTop;
      const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
      
      // Only change header visibility if scroll difference is significant
      if (Math.abs(scrollTop - lastScrollTop.current) > scrollThreshold) {
        if (scrollTop > lastScrollTop.current && scrollTop > 50) {
          // Scrolling down and past initial area - hide header
          setShowHeader(false);
        } else if (scrollTop < lastScrollTop.current) {
          // Scrolling up - show header
          setShowHeader(true);
        }
        
        lastScrollTop.current = scrollTop;
      }
    };
    
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (chatArea) {
        chatArea.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    const messageText = input.trim();
    setInput(''); // Clear input immediately before sending
    
    // Set thinking state if messaging the bot
    if (selectedUser?.isBot) {
      setIsThinking(true);
    }
    
    await sendMessage({ text: messageText });
    
    if (socket) socket.emit('stop_typing', { to: selectedUser._id });
    
    // Reset thinking state after message is sent
    setIsThinking(false);
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    if (input.trim().length > 0) {
      socket.emit('typing', { to: selectedUser._id });
    } else {
      socket.emit('stop_typing', { to: selectedUser._id });
    }
  }, [input, socket, selectedUser]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          await sendMessage({ audio: reader.result });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      if (socket) socket.emit('recording', { to: selectedUser._id });
    } catch (err) {
      toast.error('Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    if (socket) socket.emit('stop_recording', { to: selectedUser._id });
  };

  const handleCall = async () => {
    if (!selectedUser) return;
    
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("User is offline");
      return;
    }
    
    await initiateCall(selectedUser);
  };

  const handleVideoCall = async () => {
    if (!selectedUser) return;
    
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("User is offline");
      return;
    }
    
    await initiateVideoCall(selectedUser);
  };

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header */}
      <div className={`flex items-center gap-3 py-4 px-6 border-b border-stone-500 sticky top-0 z-10 bg-black/30 backdrop-blur-lg transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <img
          src={selectedUser.isBot ? assets.Chitti : (selectedUser.profilePic || assets.avatar_icon)}
          alt="User profile"
          className="w-9 h-9 rounded-full object-cover"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2 font-semibold">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <div className="flex gap-2">
          <img
            onClick={handleCall}
            src={assets.phone_icon}
            alt="Voice Call"
            className={`w-5 h-5 ${isInCall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ filter: 'invert(1)' }}
            title="Voice Call"
          />
          <img
            onClick={handleVideoCall}
            src={video_call}
            alt="Video Call"
            className={`w-5 h-5 ${isInCall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            draggable="false"
            title="Video Call"
          />
        </div>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="Back"
          className="md:hidden w-6 cursor-pointer"
        />
        <img src={assets.help_icon} alt="Help" className="max-md:hidden w-5" />
      </div>

      {/* Chat Area */}
      <div 
        ref={chatAreaRef}
        className="flex flex-col h-[calc(100vh-120px)] overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide"
      >
        {isTypingFrom === selectedUser._id && (
          <div className="text-xs text-gray-300 opacity-80">typing…</div>
        )}
        {isRecordingFrom === selectedUser._id && (
          <div className="text-xs text-gray-300 opacity-80">recording…</div>
        )}
        {isThinking && selectedUser?.isBot && (
          <div className="flex items-center gap-2 text-sm text-gray-300 opacity-80">
            <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
              {selectedUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="p-3 text-sm rounded-xl shadow-md text-white bg-gray-700 rounded-bl-none">
              <span className="inline-flex items-center">
                <span className="animate-pulse">Thinking</span>
                <span className="animate-bounce delay-75">.</span>
                <span className="animate-bounce delay-150">.</span>
                <span className="animate-bounce delay-300">.</span>
              </span>
            </div>
          </div>
        )}
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === authUser._id;
          
          // Special handling for missed calls - show as system message
          if (msg.isMissedCall) {
            return (
              <div key={index} className="flex justify-center my-3">
                <div className="bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-full">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Profile Image */}
              {!isCurrentUser && (
                selectedUser.profilePic ? (
                  <img
                    src={selectedUser.isBot ? assets.Chitti : selectedUser.profilePic}
                    alt="Sender"
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => { e.target.src = assets.avatar_icon }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )
              )}

              {/* Message Bubble */}
              <div className="flex flex-col max-w-[300px]">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="Chat media"
                    className="rounded-lg border border-gray-700"
                  />
                ) : msg.audio ? (
                  <audio controls src={msg.audio} className="max-w-[280px]"></audio>
                ) : msg.isMissedCall ? (
                  <div className="flex justify-center w-full my-2">
                    <p className="bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-full">
                      {msg.text}
                    </p>
                  </div>
                ) : (
                  <p
                    className={`p-3 text-sm rounded-xl shadow-md text-white break-words whitespace-pre-wrap ${
                      isCurrentUser
                        ? 'bg-blue-600 rounded-br-none self-end text-right'
                        : 'bg-gray-700 rounded-bl-none self-start text-left'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: msg.text && msg.text.replace(
                        /(https?:\/\/[^\s]+)/g,
                        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-300 underline">$1</a>'
                      )
                    }}
                  ></p>
                )}
                <p
                  className={`text-xs text-gray-400 mt-1 ${
                    isCurrentUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatMessageTime(msg.createdAt)}
                </p>
                <div className={`${isCurrentUser ? 'self-end' : 'self-start'} flex gap-2 mt-1`}>
                  {(!isCurrentUser && selectedUser.isBot && msg.text) && (
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[] text-white opacity-80 hover:opacity-100"
                    >
                      <img src={copy_icon} alt="Copy" className="w-3 h-3" />
                    </button>
                  )}
                  {(msg.text || msg.image || msg.audio) && (
                    <button
                      onClick={() => setShareTarget(msg)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[] text-white opacity-80 hover:opacity-100"
                    >
                      <img src={share_icon} alt="Share" className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Image for current user */}
              {isCurrentUser && (
                authUser.profilePic ? (
                  <img
                    src={authUser.profilePic}
                    alt="You"
                    className="w-7 h-7 rounded-full object-cover"
                    onError={(e) => { e.target.src = assets.avatar_icon }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                    {authUser.fullName.charAt(0).toUpperCase()}
                  </div>
                )
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center gap-3 p-3 bg-black/30 backdrop-blur-lg border-t border-gray-600">
        <div className="flex-1 flex items-center bg-gray-100/10 px-4 py-2 rounded-full border border-gray-600 shadow-md">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null}
            type="text"
            placeholder="send a message"
            className="flex-1 text-sm bg-transparent p-2 border-none outline-none text-white placeholder-gray-400"
          />
          <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="Upload" className="w-5 h-5 mr-2 cursor-pointer" />
          </label>
        </div>
        {!isRecording ? (
          <button onClick={startRecording} className="w-9 h-9 rounded-full bg-red-500/80 text-white text-xs">Mic</button>
        ) : (
          <button onClick={stopRecording} className="w-9 h-9 rounded-full bg-red-700 text-white text-xs">Stop</button>
        )}
        <img onClick={handleSendMessage} src={assets.send_button} alt="Send" className="w-7 h-7 cursor-pointer" />
      </div>
      {shareTarget && (
        <ShareModal message={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full">
      <img
        src={img99}
        alt="Chat illustration"
        className="w-40 h-40 object-cover rounded-2xl mx-auto"
      />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default Chatbox;
