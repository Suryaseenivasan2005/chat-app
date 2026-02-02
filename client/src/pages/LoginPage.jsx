import React, { useContext, useState, useRef } from 'react';
import assets from '../assets/assets';
import img99 from '../assets/img99.jpeg';
import { AuthContext } from '../../context/AuthContext';
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

// Import PFP Dropping series
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

// Import PFP Drops series
import pfp_drops from '../assets/profilepics/PFP Drops.jpg';
import pfp_drops_1 from '../assets/profilepics/PFP Drops (1).jpg';
import pfp_drops_2 from '../assets/profilepics/PFP Drops (2).jpg';
import pfp_drops_3 from '../assets/profilepics/PFP Drops (3).jpg';
import pfp_drops_4 from '../assets/profilepics/PFP Drops (4).jpg';
import pfp_drops_5 from '../assets/profilepics/PFP Drops (5).jpg';
import pfp_drops_6 from '../assets/profilepics/PFP Drops (6).jpg';

const defaultProfilePics = [
  { src: dp1, alt: 'Avatar 1' },
  { src: dp2, alt: 'Avatar 2' },
  { src: dp3, alt: 'Avatar 3' },
  { src: dp4, alt: 'Avatar 4' },
  { src: dp5, alt: 'Avatar 5' },
  { src: dp6, alt: 'Avatar 6' },
  { src: dp7, alt: 'Avatar 7' },
  { src: dp8, alt: 'Avatar 8' },
  { src: dp9, alt: 'Avatar 9' },
  { src: dp10, alt: 'Avatar 10' },
  { src: dp11, alt: 'Avatar 11' },
  { src: dp12, alt: 'Avatar 12' },
  { src: dp13, alt: 'Avatar 13' },
  { src: dp14, alt: 'Avatar 14' },
  { src: dp15, alt: 'Avatar 15' },
  { src: dp16, alt: 'Avatar 16' },
  { src: dp17, alt: 'Avatar 17' },
  { src: dp18, alt: 'Avatar 18' },
  { src: pfp_dropping, alt: 'Dropping 0' },
  { src: pfp_dropping_1, alt: 'Dropping 1' },
  { src: pfp_dropping_2, alt: 'Dropping 2' },
  { src: pfp_dropping_3, alt: 'Dropping 3' },
  { src: pfp_dropping_4, alt: 'Dropping 4' },
  { src: pfp_dropping_5, alt: 'Dropping 5' },
  { src: pfp_dropping_6, alt: 'Dropping 6' },
  { src: pfp_dropping_7, alt: 'Dropping 7' },
  { src: pfp_dropping_8, alt: 'Dropping 8' },
  { src: pfp_dropping_9, alt: 'Dropping 9' },
  { src: pfp_dropping_10, alt: 'Dropping 10' },
  { src: pfp_dropping_11, alt: 'Dropping 11' },
  { src: pfp_dropping_12, alt: 'Dropping 12' },
  { src: pfp_dropping_13, alt: 'Dropping 13' },
  { src: pfp_dropping_14, alt: 'Dropping 14' },
  { src: pfp_dropping_15, alt: 'Dropping 15' },
  { src: pfp_dropping_16, alt: 'Dropping 16' },
  { src: pfp_dropping_17, alt: 'Dropping 17' },
  { src: pfp_drops, alt: 'Drops 0' },
  { src: pfp_drops_1, alt: 'Drops 1' },
  { src: pfp_drops_2, alt: 'Drops 2' },
  { src: pfp_drops_3, alt: 'Drops 3' },
  { src: pfp_drops_4, alt: 'Drops 4' },
  { src: pfp_drops_5, alt: 'Drops 5' },
  { src: pfp_drops_6, alt: 'Drops 6' }
];

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [customProfilePic, setCustomProfilePic] = useState("");
  const fileInputRef = useRef(null);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currentState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    const profilePicToSubmit = customProfilePic || profilePic;
    login(
      currentState === "Sign up" ? 'signup' : 'login',
      {
        fullName,
        email,
        password,
        bio,
        ...(profilePicToSubmit ? { profilePic: profilePicToSubmit } : {})
      }
    );
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      {/* Left Column */}
      <div className="flex flex-col items-center gap-4 max-md:hidden">
        <img src={img99} alt="" style={{ borderRadius: '12px' }} className="w-88 h-88 shadow-2xl" />
        <h1 className="text-white text-4xl font-bold tracking-tight">Talklet</h1>
      </div>

      {/* Right Column */}
      <form onSubmit={onSubmitHandler} className="border-2 bg-white/8 text-white border-gray-500 p-8 flex flex-col gap-6 rounded-2xl shadow-2xl w-96 backdrop-blur-md">
        <h2 className="font-medium text-4xl flex justify-between items-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {currentState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer hover:scale-110 transition-transform"
            />
          )}
        </h2>

        {currentState === "Sign up" && !isDataSubmitted && (
          <input
            type="text"
            required
            className="p-3 border border-gray-500 rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="e-mail"
              className="p-3 border border-gray-500 rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="password"
              required
              className="p-3 border border-gray-500 rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </>
        )}

        {currentState === "Sign up" && isDataSubmitted && (
          <>
            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              placeholder="provide a short bio"
              required
              className="p-3 border border-gray-500 rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              rows={3}
            />

            {/* Profile Picture Selection */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-300">Choose a profile picture:</p>
              <div className="grid grid-cols-3 gap-4 place-items-center max-h-48 overflow-y-auto p-2 pr-1 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent custom-scrollbar">
                {/* Upload Custom - First Item */}
                <div
                  className={`group relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 transition-all duration-300 ${customProfilePic ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-gray-500 border-dashed hover:border-purple-400 hover:bg-white/5'
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customProfilePic ? (
                    <img
                      src={customProfilePic}
                      alt="Custom upload"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCustomProfilePic(reader.result);
                          setProfilePic("");
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
                    className={`w-16 h-16 rounded-full object-cover cursor-pointer border-2 transition-all duration-300 transform active:scale-95 ${profilePic === pic.src ? 'border-purple-500 scale-110 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-transparent hover:border-purple-300 hover:scale-105'
                      }`}
                    onClick={() => {
                      setProfilePic(pic.src);
                      setCustomProfilePic("");
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" className="py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/20 transform transition-all active:scale-[0.98]">
          {currentState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-black/20 text-purple-600 focus:ring-purple-500" />
          <p>Agree to the <span className="text-purple-400 cursor-pointer hover:underline">terms</span> & <span className="text-purple-400 cursor-pointer hover:underline">privacy</span></p>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          {currentState === "Sign up" ? (
            <p className="text-sm text-gray-400 text-center">
              Already have an account?{' '}
              <span
                onClick={() => {
                  setCurrentState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-bold text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 text-center">
              Don't have an account?{' '}
              <span
                onClick={() => setCurrentState("Sign up")}
                className="font-bold text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
              >
                Create account
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;