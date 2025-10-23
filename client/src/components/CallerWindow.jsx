import React, { useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import toast from 'react-hot-toast';
import assets from '../assets/assets.js';

const CallerWindow = ({ callData, onEnd }) => {
  const { socket, authUser } = useContext(AuthContext);
  const { setShowCallModal } = useContext(ChatContext);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ongoing, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const peerConnection = useRef(null);
  const remoteAudio = useRef(null);
  
  // Add null checks and default values
  const caller = callData?.caller || authUser;
  const receiver = callData?.receiver;
  
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
              to: receiver._id,
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
        
        // Create offer as caller
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call_offer', {
          to: receiver._id,
          offer: pc.localDescription
        });
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
      toast.info(`Call ended by ${receiver.fullName}`);
      handleEndCall();
    });
    
    return () => {
      socket.off('call_answer');
      socket.off('call_ice_candidate');
      socket.off('call_ended');
    };
  }, [socket, receiver._id]);
  
  const handleEndCall = () => {
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
      socket.emit('call_ended', { to: receiver._id });
    }
    
    // Close the modal
    setShowCallModal(false);
    
    // Call the onEnd callback
    if (onEnd) onEnd();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <div className="bg-[#282142] border border-gray-600 rounded-lg w-96 p-6 text-white flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">Voice Call</h3>
        
        {/* User info */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-700 mb-3 overflow-hidden">
            <img 
              src={receiver.profilePic || assets.avatar_icon} 
              alt={receiver.fullName}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = assets.avatar_icon }}
            />
          </div>
          <h4 className="text-lg font-medium">{receiver.fullName}</h4>
          
          {/* Call status */}
          <p className="text-gray-300 mt-1">
            {callStatus === 'connecting' ? 'Calling...' : 
             callStatus === 'ongoing' ? 'Connected' : 'Call ended'}
          </p>
          
          {/* Call timer - always visible and prominent */}
          {(callStatus === 'ongoing' || callDuration > 0) && (
            <div className="text-xl font-medium mt-3 text-white">
              {formatTime(callDuration)}
            </div>
          )}
        </div>
        
        {/* Audio element for remote stream */}
        <audio ref={remoteAudio} autoPlay />
        
        {/* Call controls */}
        <div className="flex gap-6 mt-6 justify-center">
          {/* Mute button */}
          <button 
            onClick={() => {
              if (localStream) {
                const audioTracks = localStream.getAudioTracks();
                if (audioTracks.length > 0) {
                  const enabled = !audioTracks[0].enabled;
                  audioTracks[0].enabled = enabled;
                  // Force re-render
                  setLocalStream(prev => {
                    return new MediaStream(prev.getTracks());
                  });
                }
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
          >
            <img 
              src={localStream && localStream.getAudioTracks()[0]?.enabled ? 
                "https://img.icons8.com/ios-filled/50/ffffff/microphone.png" : 
                "https://img.icons8.com/ios-filled/50/ffffff/mute.png"} 
              alt="Mute/Unmute" 
              className="w-6 h-6"
            />
          </button>
          
          {/* Speaker button */}
          <button 
            onClick={() => {
              if (remoteAudio.current) {
                remoteAudio.current.muted = !remoteAudio.current.muted;
                // Force re-render
                setRemoteStream(prev => prev ? new MediaStream(prev.getTracks()) : null);
              }
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
          >
            <img 
              src={remoteAudio.current && !remoteAudio.current.muted ? 
                "https://img.icons8.com/ios-filled/50/ffffff/speaker.png" : 
                "https://img.icons8.com/ios-filled/50/ffffff/no-audio.png"} 
              alt="Speaker" 
              className="w-6 h-6"
            />
          </button>
          
          {/* End call button */}
          <button 
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
          >
            <img 
              src={assets.end_call_icon || "https://img.icons8.com/ios-filled/50/ffffff/phone-disconnected.png"} 
              alt="End call" 
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallerWindow;