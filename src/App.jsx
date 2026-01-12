import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabaseClient'

// Components
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import LoginWithOTP from './pages/LoginWithOTP'
import VerifyEmail from './pages/VerifyEmail'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import UserProfile from './pages/UserProfile'
import PublicProfile from './pages/PublicProfile'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading CodeKrafts..." />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 text-gray-900 font-sans">
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }}
        />

        <Navbar session={session} />

        {/* Main Content Wrapper */}
        <main className="pt-20 pb-20 md:pb-8 max-w-7xl mx-auto px-4 min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Feed session={session} />} />
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login-otp" element={!session ? <LoginWithOTP /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/user/:userId" element={<PublicProfile session={session} />} />

            {/* Protected Routes */}
            <Route
              path="/create"
              element={session ? <CreatePost /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={session ? <UserProfile /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={session ? <AdminDashboard session={session} /> : <Navigate to="/login" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}