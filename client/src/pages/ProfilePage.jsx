import React, { useContext } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import img99 from '../assets/img99.jpeg'
import { AuthContext } from '../../context/AuthContext'


const ProfilePage = () => {

  const {authUser, updateProfile} = useContext(AuthContext)

  const [selectedImg, setSelectedImg] = useState(null)
  const [selectedBg, setSelectedBg] = useState(null)
  const navigate = useNavigate();
  const[name, setName] = useState(authUser?.fullName || "")
  const [bio, setBio] = useState(authUser?.bio || "")

  const handleSubmit = async(e)=>{
    e.preventDefault();
    const payload = { fullName: name, bio };
    const readFileAsBase64 = (file) => new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });
    if (selectedImg) {
      payload.profilePic = await readFileAsBase64(selectedImg);
    }
    if (selectedBg) {
      payload.backgroundImage = await readFileAsBase64(selectedBg);
    }
    await updateProfile(payload);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
          <h3 className="text-lg">Profile Details</h3>
          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
            <input onChange={(e) => setSelectedImg(e.target.files[0])} type="file" id="avatar" accept='.jpeg, .jpg, .png' hidden />
            <img src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} alt="" className={`w-12 h-12 ${selectedImg && 'rounded-full'}`} />
            upload profile image
          </label>
          <label htmlFor="bgImg" className="flex items-center gap-3 cursor-pointer">
            <input onChange={(e) => setSelectedBg(e.target.files[0])} type="file" id="bgImg" accept='.jpeg, .jpg, .png, .svg' hidden />
            <span className="px-3 py-1 rounded-full bg-[#282142] text-xs">Change background image</span>
            {selectedBg && <span className="text-xs opacity-70">{selectedBg.name}</span>}
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder="Your Name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder="Write profile bio" required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}></textarea>
          <button type="submit" className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer">
            Save
          </button>
        </form>
        <div className="flex items-center justify-center flex-1">
          <img className="max-w-44 max-h-44 aspect-square mx-10 max-sm:mt-10 rounded-xl" src={authUser?.profilePic||img99} alt="" />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;