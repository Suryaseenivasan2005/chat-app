import React, { useContext, useState, useRef } from 'react';
import assets from '../assets/assets';
import img99 from '../assets/img99.jpeg';
import { AuthContext } from '../../context/AuthContext';
// Import default profile pictures
import bear from '../assets/profilepics/bear.png';
import boy1 from '../assets/profilepics/boy (1).png';
import boy from '../assets/profilepics/boy.png';
import chicken from '../assets/profilepics/chicken.png';
import man1 from '../assets/profilepics/man (1).png';
import man from '../assets/profilepics/man.png';
import woman1 from '../assets/profilepics/woman (1).png';
import woman2 from '../assets/profilepics/woman (2).png';
import woman from '../assets/profilepics/woman.png';

const defaultProfilePics = [
  { src: bear, alt: 'Bear Avatar' },
  { src: boy1, alt: 'Boy Avatar 1' },
  { src: boy, alt: 'Boy Avatar' },
  { src: chicken, alt: 'Chicken Avatar' },
  { src: man1, alt: 'Man Avatar 1' },
  { src: man, alt: 'Man Avatar' },
  { src: woman1, alt: 'Woman Avatar 1' },
  { src: woman2, alt: 'Woman Avatar 2' },
  { src: woman, alt: 'Woman Avatar' }
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
      <img src={img99} alt="" style={{ borderRadius: '12px' }} className="w-88 h-88" />

      {/* Right Column */}
      <form onSubmit={onSubmitHandler} className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-96">
        <h2 className="font-medium text-5xl flex justify-between items-center">
          {currentState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {currentState === "Sign up" && !isDataSubmitted && (
          <input
            type="text"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
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
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="password"
              required
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Profile Picture Selection */}
            <div className="space-y-4">
              <p className="text-sm">Choose a profile picture:</p>
              <div className="grid grid-cols-3 gap-3 place-items-center max-h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {/* Upload Custom - First Item */}
                <div
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 ${customProfilePic ? 'border-purple-500' : 'border-gray-600 border-dashed hover:border-purple-400'
                    } bg-white/5 transition-all duration-300`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {customProfilePic ? (
                    <img
                      src={customProfilePic}
                      alt="Custom upload"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 hover:text-purple-400">
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
                          setProfilePic(""); // Clear selected default
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
                    className={`w-16 h-16 rounded-full object-cover cursor-pointer border-2 transition-all duration-300 ${profilePic === pic.src ? 'border-purple-500 scale-105' : 'border-transparent hover:border-purple-300'
                      }`}
                    onClick={() => {
                      setProfilePic(pic.src);
                      setCustomProfilePic(""); // Clear custom upload
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" className="py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer">
          {currentState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" />
          <p style={{ color: "gray" }}>Agree to the terms of use & privacy policy</p>
        </div>

        <div className="flex flex-col gap-2">
          {currentState === "Sign up" ? (
            <p className="text-sm text-gray-400" style={{ color: "gray" }}>
              Already have an account ?
              <span
                onClick={() => {
                  setCurrentState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-500 cursor-pointer"
                style={{ color: "violet" }}
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400" style={{ color: "gray" }}>
              Don't have an account ?
              <span
                onClick={() => setCurrentState("Sign up")}
                className="font-medium text-violet-500 cursor-pointer"
                style={{ color: "violet" }}
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;