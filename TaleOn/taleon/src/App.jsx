import React from 'react'
import './App.css'
import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AuthSuccess from './pages/auth/AuthSuccess'
import Landing from './pages/home/Landing'
import Archive from './pages/home/Archive'
import CreateRoom from './pages/room/CreateRoom'
import JoinRoom from './pages/room/JoinRoom'
import Lobby from './pages/room/Lobby'
import Toss from './pages/room/Toss'
import GameRoom from './pages/game/GameRoom'
import Judgement from './pages/game/Judgement'
import Roast from './pages/game/Roast'
import Error from './pages/misc/Error'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import { ToastProvider } from './components/UI/Toast'

function App() {

  return (
    <ToastProvider>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* Room setup */}
        <Route path="/create-room" element={
          <MainLayout>
            <CreateRoom />
          </MainLayout>
        } />
        <Route path="/join-room" element={
          <MainLayout>
            <JoinRoom />
          </MainLayout>
        } />

        {/* Game flow */}
        <Route path="/lobby" element={
          <MainLayout>
            <Lobby />
          </MainLayout>
        } />
        <Route path="/toss" element={
          <MainLayout>
            <Toss />
          </MainLayout>
        } />
        <Route path="/game-room" element={
          <MainLayout>
            <GameRoom />
          </MainLayout>
        } />
        <Route path="/judgement" element={
          <MainLayout>
            <Judgement />
          </MainLayout>
        } />
        <Route path="/roast" element={
          <MainLayout>
            <Roast />
          </MainLayout>
        } />

        {/* Archive & Error */}
        <Route path="/archive" element={
          <MainLayout>
            <Archive />
          </MainLayout>
        } />
        <Route path="/error" element={<Error />} />

        {/* Catch-all */}
        <Route path="*" element={<Error />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
