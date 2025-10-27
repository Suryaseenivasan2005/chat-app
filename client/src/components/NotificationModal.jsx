import React, { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import toast from 'react-hot-toast';

const NotificationModal = () => {
  const { 
    notifications, 
    showNotificationModal, 
    setShowNotificationModal, 
    respondToRequest 
  } = useContext(NotificationContext);

  const handleAccept = async (requestId, senderName) => {
    const success = await respondToRequest(requestId, 'accept');
    if (success) {
      toast.success(`Friend request from ${senderName} accepted!`);
    } else {
      toast.error('Failed to accept friend request');
    }
  };

  const handleReject = async (requestId, senderName) => {
    const success = await respondToRequest(requestId, 'reject');
    if (success) {
      toast.success(`Friend request from ${senderName} rejected`);
    } else {
      toast.error('Failed to reject friend request');
    }
  };

  if (!showNotificationModal) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setShowNotificationModal(false)}
      ></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#282142] rounded-lg p-6 z-50 w-96 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Friend Requests</h2>
          <button
            onClick={() => setShowNotificationModal(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No pending friend requests</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((request) => (
              <div key={request._id} className="flex items-center gap-3 p-3 bg-[#8185B2]/20 rounded-lg">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={request.senderId.profilePic || '/avatar_icon.png'}
                    alt={request.senderId.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{request.senderId.fullName}</p>
                  <p className="text-gray-400 text-sm">wants to be your friend</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request._id, request.senderId.fullName)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request._id, request.senderId.fullName)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationModal;
