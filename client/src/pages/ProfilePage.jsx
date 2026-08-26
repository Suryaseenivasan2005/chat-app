import React, { useContext, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import img99 from '../assets/img99.jpeg'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Import default profile pictures
import dp1 from '../assets/profilepics/dp1.jpeg';
import dp2 from '../assets/profilepics/dp2.jpeg';
import dp3 from '../assets/profilepics/dp3.jpeg';
import dp4 from '../assets/profilepics/dp4.jpeg';
import dp5 from '../assets/profilepics/dp5.jpeg';
import dp6 from '../assets/profilepics/dp6.jpeg';
import dp7 from '../assets/profilepics/dp7.jpeg';
import dp8 from '../assets/profilepics/dp8.jpeg';
import dp9 from '../assets/profilepics/dp9.jpeg';
import dp10 from '../assets/profilepics/dp10.jpeg';
import dp11 from '../assets/profilepics/dp11.jpeg';
import dp12 from '../assets/profilepics/dp12.jpeg';
import dp13 from '../assets/profilepics/dp13.jpeg';
import dp14 from '../assets/profilepics/dp14.jpeg';
import dp15 from '../assets/profilepics/dp15.jpeg';
import dp16 from '../assets/profilepics/dp16.jpeg';
import dp17 from '../assets/profilepics/dp17.jpeg';
import dp18 from '../assets/profilepics/dp18.jpeg';

import pfp_dropping from '../assets/profilepics/PFP dropping.jpg';
import pfp_dropping_1 from '../assets/profilepics/PFP dropping (1).jpg';
import pfp_dropping_2 from '../assets/profilepics/PFP dropping (2).jpg';
import pfp_dropping_3 from '../assets/profilepics/PFP dropping (3).jpg';
import pfp_dropping_4 from '../assets/profilepics/PFP dropping (4).jpg';
import pfp_dropping_5 from '../assets/profilepics/PFP dropping (5).jpg';
import pfp_dropping_6 from '../assets/profilepics/PFP dropping (6).jpg';
import pfp_dropping_7 from '../assets/profilepics/PFP dropping (7).jpg';
import pfp_dropping_8 from '../assets/profilepics/PFP dropping (8).jpg';
import pfp_dropping_9 from '../assets/profilepics/PFP dropping (9).jpg';
import pfp_dropping_10 from '../assets/profilepics/PFP dropping (10).jpg';
import pfp_dropping_11 from '../assets/profilepics/PFP dropping (11).jpg';
import pfp_dropping_12 from '../assets/profilepics/PFP dropping (12).jpg';
import pfp_dropping_13 from '../assets/profilepics/PFP dropping (13).jpg';
import pfp_dropping_14 from '../assets/profilepics/PFP dropping (14).jpg';
import pfp_dropping_15 from '../assets/profilepics/PFP dropping (15).jpg';
import pfp_dropping_16 from '../assets/profilepics/PFP dropping (16).jpg';
import pfp_dropping_17 from '../assets/profilepics/PFP dropping (17).jpg';

import pfp_drops from '../assets/profilepics/PFP Drops.jpg';
import pfp_drops_1 from '../assets/profilepics/PFP Drops (1).jpg';
import pfp_drops_2 from '../assets/profilepics/PFP Drops (2).jpg';
import pfp_drops_3 from '../assets/profilepics/PFP Drops (3).jpg';
import pfp_drops_4 from '../assets/profilepics/PFP Drops (4).jpg';
import pfp_drops_5 from '../assets/profilepics/PFP Drops (5).jpg';
import pfp_drops_6 from '../assets/profilepics/PFP Drops (6).jpg';

const defaultProfilePics = [
  { src: dp1, alt: 'Avatar 1' }, { src: dp2, alt: 'Avatar 2' }, { src: dp3, alt: 'Avatar 3' },
  { src: dp4, alt: 'Avatar 4' }, { src: dp5, alt: 'Avatar 5' }, { src: dp6, alt: 'Avatar 6' },
  { src: dp7, alt: 'Avatar 7' }, { src: dp8, alt: 'Avatar 8' }, { src: dp9, alt: 'Avatar 9' },
  { src: dp10, alt: 'Avatar 10' }, { src: dp11, alt: 'Avatar 11' }, { src: dp12, alt: 'Avatar 12' },
  { src: dp13, alt: 'Avatar 13' }, { src: dp14, alt: 'Avatar 14' }, { src: dp15, alt: 'Avatar 15' },
  { src: dp16, alt: 'Avatar 16' }, { src: dp17, alt: 'Avatar 17' }, { src: dp18, alt: 'Avatar 18' },
  { src: pfp_dropping, alt: 'Dropping 0' }, { src: pfp_dropping_1, alt: 'Dropping 1' },
  { src: pfp_dropping_2, alt: 'Dropping 2' }, { src: pfp_dropping_3, alt: 'Dropping 3' },
  { src: pfp_dropping_4, alt: 'Dropping 4' }, { src: pfp_dropping_5, alt: 'Dropping 5' },
  { src: pfp_dropping_6, alt: 'Dropping 6' }, { src: pfp_dropping_7, alt: 'Dropping 7' },
  { src: pfp_dropping_8, alt: 'Dropping 8' }, { src: pfp_dropping_9, alt: 'Dropping 9' },
  { src: pfp_dropping_10, alt: 'Dropping 10' }, { src: pfp_dropping_11, alt: 'Dropping 11' },
  { src: pfp_dropping_12, alt: 'Dropping 12' }, { src: pfp_dropping_13, alt: 'Dropping 13' },
  { src: pfp_dropping_14, alt: 'Dropping 14' }, { src: pfp_dropping_15, alt: 'Dropping 15' },
  { src: pfp_dropping_16, alt: 'Dropping 16' }, { src: pfp_dropping_17, alt: 'Dropping 17' },
  { src: pfp_drops, alt: 'Drops 0' }, { src: pfp_drops_1, alt: 'Drops 1' },
  { src: pfp_drops_2, alt: 'Drops 2' }, { src: pfp_drops_3, alt: 'Drops 3' },
  { src: pfp_drops_4, alt: 'Drops 4' }, { src: pfp_drops_5, alt: 'Drops 5' },
  { src: pfp_drops_6, alt: 'Drops 6' }
];

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext)
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedImg, setSelectedImg] = useState(null) // Base64 for custom upload
  const [selectedAvatar, setSelectedAvatar] = useState(authUser?.profilePic || "") // Selected default path
  const [selectedBg, setSelectedBg] = useState(null)
  const [name, setName] = useState(authUser?.fullName || "")
  const [bio, setBio] = useState(authUser?.bio || "")

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block profile edits for demo users
    if (authUser?.isDemo) {
      toast.error('Sign in to edit your profile. This feature is disabled in Demo Mode.');
      return;
    }

    const payload = { fullName: name, bio };

    const readFileAsBase64 = (file) => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });

    if (selectedImg) {
      payload.profilePic = selectedImg;
    } else if (selectedAvatar) {
      payload.profilePic = selectedAvatar;
    }

    if (selectedBg) {
      payload.backgroundImage = await readFileAsBase64(selectedBg);
    }

    await updateProfile(payload);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] bg-cover bg-no-repeat flex items-center justify-center p-4">
      {/* Small fixed demo timer pill — same as HomePage */}
      {authUser?.isDemo && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-black/50 text-purple-200 border border-purple-500/30 shadow-lg backdrop-blur-sm pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
          Demo
        </div>
      )}
      <div className="w-full max-w-4xl backdrop-blur-3xl bg-white/5 text-gray-100 border border-white/10 flex items-stretch gap-0 max-md:flex-col-reverse rounded-3xl overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8 md:p-12 flex-1 bg-black/20">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Profile Details</h3>
            <p className="text-gray-400 text-sm mt-1">Update your identity on Talklet</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-300">Choose a profile picture:</p>
            <div className="grid grid-cols-4 gap-4 max-h-48 overflow-y-auto p-2 pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent custom-scrollbar">
              {/* Custom Upload Slot */}
              <div
                className={`group relative aspect-square rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden border-2 transition-all duration-300 ${selectedImg ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-gray-600 border-dashed hover:border-purple-400/50 hover:bg-white/5'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedImg ? (
                  <img src={selectedImg} alt="Custom" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-bold">UPLOAD</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSelectedImg(reader.result);
                        setSelectedAvatar("");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              {/* Default Avatars */}
              {defaultProfilePics.map((pic, index) => (
                <img
                  key={index}
                  src={pic.src}
                  alt={pic.alt}
                  className={`aspect-square rounded-2xl object-cover cursor-pointer border-2 transition-all duration-300 transform active:scale-90 ${selectedAvatar === pic.src ? 'border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-transparent hover:border-white/30 hover:scale-105'}`}
                  onClick={() => {
                    setSelectedAvatar(pic.src);
                    setSelectedImg(null);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type="text"
                required
                placeholder="How should we call you?"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Bio</label>
              <textarea
                onChange={(e) => setBio(e.target.value)}
                value={bio}
                placeholder="A little about yourself..."
                required
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600 resize-none"
                rows={3}
              />
            </div>
          </div>

          <label htmlFor="bgImg" className="flex items-center gap-3 cursor-pointer group">
            <input onChange={(e) => setSelectedBg(e.target.files[0])} type="file" id="bgImg" accept='.jpeg, .jpg, .png, .svg' hidden />
            <div className="px-4 py-2 rounded-xl bg-purple-600/20 text-purple-400 text-xs font-bold group-hover:bg-purple-600/30 transition-all border border-purple-500/20">
              {selectedBg ? 'Changed Background' : 'Change Theme Background'}
            </div>
            {selectedBg && <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{selectedBg.name}</span>}
          </label>

          <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-purple-900/20 transform transition-all active:scale-[0.98] mt-2">
            Save Changes
          </button>
        </form>

        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-purple-600/10 to-indigo-600/10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              className="relative w-64 h-64 object-cover rounded-2xl shadow-2xl shadow-black/50"
              src={selectedImg || selectedAvatar || authUser?.profilePic || img99}
              alt="Profile Preview"
            />
          </div>
          <p className="mt-6 text-sm font-medium text-gray-400">Live Preview</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;