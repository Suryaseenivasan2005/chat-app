import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import GroupCreatePage from './pages/GroupCreatePage.jsx'
import FriendRequestPage from './pages/FriendRequestPage.jsx'
import { Toaster } from "react-hot-toast"
import { AuthContext } from '../context/AuthContext.jsx'
import { ChatContext } from '../context/ChatContext.jsx'
import { CallingProvider } from '../context/CallingContext.jsx'
import { NotificationProvider } from '../context/NotificationContext.jsx'
import CallingInterface from './components/CallingInterface.jsx'
import NotificationModal from './components/NotificationModal.jsx'
import DemoIntroPage from './pages/DemoIntroPage.jsx'
import DemoExpiredPage from './pages/DemoExpiredPage.jsx'

const App = () => {
  const { authUser, demoExpired } = useContext(AuthContext)
  
  return (
    <CallingProvider>
      <NotificationProvider>
        <div className="bg-[url('/bgImage.svg')] bg-contain min-h-screen">
          <Toaster />
          <CallingInterface />
          <NotificationModal />

          {/* Global demo expiry overlay — sits above everything when shown */}
          {demoExpired && <DemoExpiredPage />}

          <Routes>
            <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/demo" element={<DemoIntroPage />} />
            <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/groups/create" element={authUser ? <GroupCreatePage /> : <Navigate to="/login" />} />
            <Route path="/friends/request" element={authUser ? <FriendRequestPage /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </NotificationProvider>
    </CallingProvider>
  )
}

export default App;