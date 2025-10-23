import React, { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import toast from 'react-hot-toast';
import assets from '../assets/assets.js';

const VoiceCall = ({ callData, onEnd }) => {
  const { socket, authUser } = useContext(AuthContext);
  const { sendMessage, selectedUser, setShowCallModal } = useContext(ChatContext);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ongoing, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const peerConnection = useRef(null);
  const remoteAudio = useRef(null);
  
  // Add null checks and default values
  const caller = callData?.caller || authUser;
  const receiver = callData?.receiver || selectedUser;
  
  // Only proceed if we have valid data
  if (!caller || !receiver || !authUser) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
        <div className="bg-[#282142] border border-gray-600 rounded-lg w-80 p-6 text-white flex flex-col items-center">
          <p>Call data is incomplete. Please try again.</p>
          <button 
            onClick={onEnd}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  const isIncoming = caller._id !== authUser._id;
  const otherUser = isIncoming ? caller : receiver;

  // Format time for call duration display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Start timer function
  const startTimer = () => {
    // Clear any existing timer first
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Start a new timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // Set up WebRTC when component mounts
  useEffect(() => {
    const setupCall = async () => {
      try {
        // Get user media (audio only)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
        
        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnection.current = pc;
        
        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call_ice_candidate', {
              to: otherUser._id,
              candidate: event.candidate
            });
          }
        };
        
        // Handle incoming tracks (remote audio)
        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteAudio.current) {
            remoteAudio.current.srcObject = event.streams[0];
          }
          setCallStatus('ongoing');
          
          // Start call timer when call is connected
          startTimer();
        };
        
        // Create offer if initiating the call
        if (!isIncoming) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call_offer', {
            to: receiver._id,
            offer: pc.localDescription
          });
        }
      } catch (error) {
        toast.error('Failed to access microphone');
        handleEndCall();
      }
    };
    
    setupCall();
    
    return () => {
      // Clean up
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);
  
  // Handle socket events for call signaling
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming offer
    socket.on('call_offer', async ({ from, offer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('call_answer', {
          to: from,
          answer: peerConnection.current.localDescription
        });
      }
    });
    
    // Handle answer to our offer
    socket.on('call_answer', async ({ from, answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    
    // Handle ICE candidates
    socket.on('call_ice_candidate', async ({ from, candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    
    // Handle call ended by other user
    socket.on('call_ended', () => {
      toast.info(`Call ended by ${otherUser.fullName}`);
      handleEndCall();
    });
    
    return () => {
      socket.off('call_offer');
      socket.off('call_answer');
      socket.off('call_ice_candidate');
      socket.off('call_ended');
    };
  }, [socket, otherUser._id]);
  
  const handleEndCall = async () => {
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Emit call ended event
    if (socket) {
      socket.emit('call_ended', { to: otherUser._id });
    }
    
    // Add missed call message if call was not answered
    if (callStatus === 'connecting') {
      await sendMessage({ 
        text: `Missed voice call from ${authUser.fullName}`,
        isMissedCall: true
      });
    }
    
    setCallStatus('ended');
    // Reset call state in ChatContext
    setShowCallModal(false);
    onEnd();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div className="bg-gradient-to-b from-[#282142] to-[#1a1630] border border-gray-600 rounded-2xl w-[350px] p-8 text-white flex flex-col items-center">
        <img 
          src={otherUser?.profilePic || assets.avatar_icon} 
          alt={otherUser.fullName}
          className="w-32 h-32 rounded-full object-cover mb-6 border-4 border-purple-500/30" 
        />
        
        <h3 className="text-2xl font-semibold mb-2">{otherUser.fullName}</h3>
        
        <p className="text-gray-300 mb-4 text-center">
          {callStatus === 'connecting' ? 'Connecting...' : 
           callStatus === 'ongoing' ? 'Call in progress' : 'Call ended'}
        </p>
        
        {/* Call timer */}
        {callStatus === 'ongoing' && (
          <div className="text-xl font-medium mb-6 text-white">
            {formatTime(callDuration)}
          </div>
        )}
        
        {/* Audio element for remote stream */}
        <audio ref={remoteAudio} autoPlay />
        
        <div className="flex gap-6 mt-4">
          {callStatus === 'connecting' && isIncoming && (
            <>
              <button 
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-5 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                  <line x1="23" y1="1" x2="1" y2="23"></line>
                </svg>
              </button>
              
              <button 
                onClick={() => setCallStatus('ongoing')}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full p-5 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
            </>
          )}
          
          {(callStatus !== 'connecting' || !isIncoming) && (
            <button 
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-5 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
                <line x1="23" y1="1" x2="1" y2="23"></line>
              </svg>
            </button>
          )}
        </div>
        
        {callStatus === 'ongoing' && (
          <div className="flex gap-4 mt-6">
            <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            
            <button className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-8">
          {callStatus === 'ongoing' && "Voice call • End-to-end encrypted"}
        </div>
      </div>
    </div>
  );
};

export default VoiceCall;