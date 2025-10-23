import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import GroupCreatePage from './pages/GroupCreatePage.jsx'
import { Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext.jsx'
import { ChatContext } from '../context/ChatContext.jsx'
import { CallingProvider } from '../context/CallingContext.jsx'
import CallingInterface from './components/CallingInterface.jsx'

const App = () => {
  const { authUser } = useContext(AuthContext)
  
  return (
    <CallingProvider>
      <div className="bg-[url('/bgImage.svg')] bg-contain min-h-screen">
        <Toaster />
        <CallingInterface />
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/groups/create" element={authUser ? <GroupCreatePage /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </CallingProvider>
  )
}

export default App;