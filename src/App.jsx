import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabaseClient'

// Components
import Navbar from './components/Navbar'
import LeftSidebar from './components/LeftSidebar'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar' // This is the Right Sidebar
import LoadingSpinner from './components/LoadingSpinner'

// Standard Pages
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
import Search from './pages/Search'
import PostDetails from './pages/PostDetails'
import Settings from './pages/Settings'
import Bookmarks from './pages/Bookmarks'

// Admin Components
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import TableViewer from './admin/TableViewer'

import TagManager from './admin/TagManager'

import UserManager from './admin/UserManager'

// Wrapper for the Standard App UI (Navbar + Footer/etc)
const StandardLayout = ({ session }) => {
  const location = useLocation()
  // Only show Right Sidebar on Home and Search pages to reduce clutter
  const showRightSidebar = ['/', '/search'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar session={session} />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <Navbar session={session} isMobile={true} />
      </div>

      <div className="max-w-6xl mx-auto flex justify-center pt-20 md:pt-24 px-4 gap-8">
        {/* Main Content Feed - Centered & Focused */}
        <main className={`flex-1 min-w-0 w-full min-h-screen pb-24 md:pb-8 ${showRightSidebar ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <Outlet />
        </main>

        {/* Right Sidebar - Widgets (Hidden on Mobile/Tablet and non-feed pages) */}
        {showRightSidebar && (
          <div className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
            <div className="sticky top-24">
              <Sidebar session={session} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav session={session} />
    </div>
  )
}

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Only update if the access token has actually changed to prevent refresh loops
      setSession(prev => {
        if (prev?.access_token !== newSession?.access_token) {
          return newSession
        }
        return prev
      })
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading CodeKrafts..." />
  }

  return (
    <BrowserRouter>
      {/* Universal Toaster */}
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

      <Routes>
        {/* === ADMIN ROUTES === */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tags" element={<TagManager />} />
          <Route path="users/:userId" element={<UserManager />} />
          <Route path="table/:tableName" element={<TableViewer />} />
        </Route>

        {/* === STANDARD APP ROUTES === */}
        <Route element={<StandardLayout session={session} />}>
          {/* Public Routes */}
          <Route path="/" element={<Feed session={session} />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login-otp" element={!session ? <LoginWithOTP /> : <Navigate to="/" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public/Private Routes */}
          <Route path="/user/:userId" element={<PublicProfile session={session} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/post/:postId" element={<PostDetails session={session} />} />

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
            path="/settings"
            element={session ? <Settings session={session} /> : <Navigate to="/login" />}
          />
          <Route
            path="/bookmarks"
            element={session ? <Bookmarks session={session} /> : <Navigate to="/login" />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}