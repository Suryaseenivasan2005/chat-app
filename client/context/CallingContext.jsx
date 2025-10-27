import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { ChatContext } from './ChatContext.jsx';
import toast from 'react-hot-toast';

export const CallingContext = createContext();

export const CallingProvider = ({ children }) => {
  const { socket, authUser } = useContext(AuthContext);
  const { sendMessage } = useContext(ChatContext);
  
  // Call state
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  
  // WebRTC refs
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const remoteAudio = useRef(null);
  const remoteVideo = useRef(null);
  const localVideo = useRef(null);
  const timerInterval = useRef(null);
  const callTimeout = useRef(null);
  
  // Format time for call duration display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Start call timer
  const startCallTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    setCallDuration(0);
    timerInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  // Initialize call - called by caller
  const initiateCall = async (receiver) => {
    if (!socket || !receiver) return false;
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Get user media with better error handling (audio only initially)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false // Start with voice call only
      });
      localStream.current = stream;
      setIsVideoOn(false); // Start with video disabled
      
      // Create peer connection
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
      
      // Handle incoming tracks (remote audio + video)
      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
        if (remoteAudio.current) {
          remoteAudio.current.srcObject = event.streams[0];
        }
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
        }
        setCallStatus('connected');
        startCallTimer();
        toast.success('Call connected!');
      };
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Set call data and emit call initiation
      const callerData = {
        caller: authUser,
        receiver: receiver,
        offer: pc.localDescription
      };
      
      setCallData(callerData);
      setCallStatus('calling');
      setIsInCall(true);
      
      // Set timeout for call (30 seconds)
      callTimeout.current = setTimeout(() => {
        toast.error('Call timed out');
        endCall();
      }, 30000);
      
      // Emit call initiation with proper offer data
      socket.emit('call_initiate', {
        to: receiver._id,
        caller: authUser,
        receiver: receiver,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
      
      toast.success(`Calling ${receiver.fullName}...`);
      return true;
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Voice calls are not supported in this browser.');
      } else {
        toast.error('Failed to access microphone: ' + error.message);
      }
      return false;
    }
  };

  // Accept incoming call - called by receiver
  const acceptCall = async (incomingCallData) => {
    if (!socket || !incomingCallData) return false;
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Decide whether to request video based on incomingCallData.isVideoCall
      const wantVideo = !!incomingCallData.isVideoCall;
      
      // Get user media with video if requested
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false
      });
      localStream.current = stream;
      setIsVideoOn(!!wantVideo); // Set initial video state
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnection.current = pc;
      
      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call_ice_candidate', {
            to: incomingCallData.caller._id,
            candidate: event.candidate
          });
        }
      };
      
      // Handle incoming tracks
      pc.ontrack = (event) => {
        remoteStream.current = event.streams[0];
        if (remoteAudio.current) {
          remoteAudio.current.srcObject = event.streams[0];
        }
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
        }
        setCallStatus('connected');
        startCallTimer();
        toast.success('Call connected!');
      };
      
      // Set remote description and create answer
      if (incomingCallData.offer && incomingCallData.offer.type && incomingCallData.offer.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
      } else {
        console.error('Invalid offer received:', incomingCallData.offer);
        throw new Error('Invalid offer received - missing type or sdp');
      }
      
      // Emit answer with proper answer data
      socket.emit('call_answer', {
        to: incomingCallData.caller._id,
        answer: {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp
        }
      });
      
      setCallData(incomingCallData);
      setCallStatus('connected');
      setIsInCall(true);
      
      toast.success('Call accepted!');
      return true;
      
    } catch (error) {
      console.error('Failed to accept call:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Voice calls are not supported in this browser.');
      } else {
        toast.error('Failed to access microphone: ' + error.message);
      }
      return false;
    }
  };

  // Reject incoming call
  const rejectCall = (incomingCallData) => {
    if (!socket || !incomingCallData) return;
    
    socket.emit('call_rejected', {
      to: incomingCallData.caller._id
    });
    
    // Send missed call message
    sendMessage({
      text: `Missed voice call from ${incomingCallData.caller.fullName}`,
      isMissedCall: true
    });
    
    endCall();
    toast.success('Call rejected');
  };

  // End call
  const endCall = () => {
    try {
      // Stop all media tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          track.stop();
        });
        localStream.current = null;
      }
      
      // Close peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Stop timer
      stopCallTimer();
      
      // Clear call timeout
      if (callTimeout.current) {
        clearTimeout(callTimeout.current);
        callTimeout.current = null;
      }
      
      // Emit call ended event
      if (socket && callData) {
        const otherUserId = callData.caller._id === authUser._id 
          ? callData.receiver._id 
          : callData.caller._id;
        
        socket.emit('call_ended', { to: otherUserId });
      }
      
      // Reset state
      setCallData(null);
      setCallStatus('idle');
      setIsInCall(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(true);
      setIsVideoOn(false);
      
      toast.success('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
      // Force reset state even if there's an error
      setCallData(null);
      setCallStatus('idle');
      setIsInCall(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(true);
      setIsVideoOn(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        setIsMuted(!enabled);
      }
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (remoteAudio.current) {
      remoteAudio.current.muted = !remoteAudio.current.muted;
      setIsSpeakerOn(!remoteAudio.current.muted);
    }
  };

  // Initialize direct video call - called by caller
  const initiateVideoCall = async (receiver) => {
    if (!socket || !receiver) return false;
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Get user media with video enabled from start
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      // Create a new MediaStream for local video
      localStream.current = new MediaStream();
      
      // Add tracks to the local stream
      stream.getTracks().forEach(track => {
        localStream.current.addTrack(track);
      });
      
      setIsVideoOn(true); // Start with video enabled
      
      // Set local video stream
      if (localVideo.current) {
        localVideo.current.srcObject = localStream.current;
        localVideo.current.muted = true; // Mute local video to prevent echo
      }
      
      // Create peer connection
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
      
      // Handle incoming tracks (remote audio + video)
      pc.ontrack = (event) => {
        // Create a new MediaStream if it doesn't exist
        if (!remoteStream.current) {
          remoteStream.current = new MediaStream();
        }
        
        // Add the track to our remote stream
        event.track.onunmute = () => {
          if (!remoteStream.current.getTracks().includes(event.track)) {
            remoteStream.current.addTrack(event.track);
          }
        };

        // Update the video element when we get a video track
        if (event.track.kind === 'video') {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream.current;
          }
        }

        // Update the audio element when we get an audio track
        if (event.track.kind === 'audio') {
          if (remoteAudio.current) {
            remoteAudio.current.srcObject = remoteStream.current;
          }
        }

        setCallStatus('connected');
        startCallTimer();
        toast.success('Call connected!');
      };
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Set call data and emit call initiation
      const callerData = {
        caller: authUser,
        receiver: receiver,
        offer: pc.localDescription,
        isVideoCall: true
      };
      
      setCallData(callerData);
      setCallStatus('calling');
      setIsInCall(true);
      
      // Set timeout for call (30 seconds)
      callTimeout.current = setTimeout(() => {
        toast.error('Call timed out');
        endCall();
      }, 30000);
      
      // Emit call initiation with proper offer data
      socket.emit('call_initiate', {
        to: receiver._id,
        caller: authUser,
        receiver: receiver,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        isVideoCall: true
      });
      
      toast.success(`Starting video call with ${receiver.fullName}...`);
      return true;
      
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Video calls are not supported in this browser.');
      } else {
        toast.error('Failed to access camera: ' + error.message);
      }
      return false;
    }
  };

  // Toggle video (upgrade from voice to video call)
  const toggleVideo = async () => {
    if (!localStream.current) return;
    
    try {
      if (!isVideoOn) {
        // Upgrade to video call - add video track
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { max: 30 }
          }
        });
        
        // Add video track to existing stream
        const videoTrack = videoStream.getVideoTracks()[0];
        
        // Remove any existing video tracks first
        const existingVideoTracks = localStream.current.getVideoTracks();
        existingVideoTracks.forEach(track => {
          localStream.current.removeTrack(track);
          track.stop();
        });
        
        // Add the new video track
        localStream.current.addTrack(videoTrack);
        
        // Update the peer connection
        if (peerConnection.current) {
          const senders = peerConnection.current.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          
          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          } else {
            peerConnection.current.addTrack(videoTrack, localStream.current);
          }
          
          // Create and send new offer
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          
          if (socket && callData) {
            const otherUserId = callData.caller._id === authUser._id 
              ? callData.receiver._id 
              : callData.caller._id;
            
            socket.emit('call_offer', {
              to: otherUserId,
              offer: peerConnection.current.localDescription
            });
          }
        }
        
        // Set local video stream
        if (localVideo.current) {
          localVideo.current.srcObject = localStream.current;
        }
        
        setIsVideoOn(true);
        toast.success('Video enabled');
      } else {
        // Disable video - remove video track
        const videoTracks = localStream.current.getVideoTracks();
        videoTracks.forEach(track => {
          track.stop();
          localStream.current.removeTrack(track);
        });
        
        if (peerConnection.current) {
          const senders = peerConnection.current.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          if (videoSender) {
            videoSender.track.stop();
            peerConnection.current.removeTrack(videoSender);
          }
        }
        
        setIsVideoOn(false);
        toast.success('Video disabled');
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Camera access denied');
      } else {
        toast.error('Failed to toggle video');
      }
    }
  };

  // Handle socket events
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming call
    socket.on('call_initiate', async ({ caller, receiver, offer, isVideoCall }) => {
      if (!caller || !receiver) {
        console.error('Invalid call data received');
        return;
      }

      const incomingCallData = { caller, receiver, offer, isVideoCall };
      setCallData(incomingCallData);
      setCallStatus('ringing');
      setIsInCall(true);
      toast.success(`Incoming call from ${caller.fullName}`);
    });
    
    // Handle call answer
    socket.on('call_answer', async ({ from, answer }) => {
      if (peerConnection.current && answer && answer.type && answer.sdp) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Failed to set remote description:', error);
          toast.error('Failed to connect call');
        }
      }
    });
    
    // Handle ICE candidates
    socket.on('call_ice_candidate', async ({ from, candidate }) => {
      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      }
    });
    
    // Handle call ended
    socket.on('call_ended', () => {
      endCall();
    });
    
    // Handle call rejected
    socket.on('call_rejected', () => {
      endCall();
      toast.success('Call was rejected');
    });
    
    return () => {
      socket.off('call_initiate');
      socket.off('call_answer');
      socket.off('call_ice_candidate');
      socket.off('call_ended');
      socket.off('call_rejected');
    };
  }, [socket]);

  // Cleanup on unmount and prevent device conflicts
  useEffect(() => {
    return () => {
      // Clean up any existing streams
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => {
          track.stop();
          localStream.current.removeTrack(track);
        });
        localStream.current = null;
      }
      
      // Clean up peer connection
      if (peerConnection.current) {
        peerConnection.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        peerConnection.current.close();
        peerConnection.current = null;
      }
      
      // Clean up video elements
      if (localVideo.current) {
        localVideo.current.srcObject = null;
      }
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = null;
      }
      
      // Clear timers
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (callTimeout.current) {
        clearTimeout(callTimeout.current);
        callTimeout.current = null;
      }
      
      // Reset state
      setIsVideoOn(false);
      setIsMuted(false);
      setIsSpeakerOn(true);
    };
  }, []);

  const value = {
    // State
    isInCall,
    callData,
    callStatus,
    callDuration,
    isMuted,
    isSpeakerOn,
    isVideoOn,
    
    // Actions
    initiateCall,
    initiateVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    
    // Utils
    formatTime,
    remoteAudio,
    remoteVideo,
    localVideo
  };

  return (
    <CallingContext.Provider value={value}>
      {children}
    </CallingContext.Provider>
  );
};
