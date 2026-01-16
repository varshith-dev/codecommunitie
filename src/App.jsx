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
import UserPrompts from './components/UserPrompts'
import AuthModal from './components/AuthModal'

// Standard Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import LoginWithOTP from './pages/LoginWithOTP'
import VerifyEmail from './pages/VerifyEmail'
import VerifyEmailToken from './pages/VerifyEmailToken'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import UserProfile from './pages/UserProfile'
import PublicProfile from './pages/PublicProfile'
import Search from './pages/Search'
import PostDetails from './pages/PostDetails'
import Settings from './pages/Settings'
import Bookmarks from './pages/Bookmarks'
import GetVerified from './pages/GetVerified'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Referrals from './pages/Referrals'
import AdvertiserDashboard from './advertiser/Dashboard'
import CreateCampaign from './advertiser/CreateCampaign'
import CampaignDetails from './advertiser/CampaignDetails'
import AdminAdManager from './admin/AdminAdManager'
import AdminCampaignDetails from './admin/AdminCampaignDetails'



// Admin Components
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import TableViewer from './admin/TableViewer'
import UserList from './admin/UserList'
import StorageCleanup from './admin/StorageCleanup'
import TagManager from './admin/TagManager'
import VerificationRequests from './admin/VerificationRequests'
import MediaReview from './admin/MediaReview'
import UserManager from './admin/UserManager'
import AdminSettings from './admin/AdminSettings'
import UserMonitor from './admin/UserMonitor'
import FeatureManager from './admin/FeatureManager'
import BetaManager from './admin/BetaManager'
import ReleaseManager from './admin/ReleaseManager'
import EmailComposer from './admin/email/EmailDashboard'
import AdminReferrals from './admin/AdminReferrals'
import PromptSettings from './admin/components/PromptSettings'
import { FeatureProvider } from './context/FeatureContext'

// Wrapper for the Standard App UI (Navbar + Footer/etc)
const StandardLayout = ({ session }) => {
  const location = useLocation()

  // Global Verification Guard
  // If user is logged in but not verified, force them to /verify-email
  // unless they are already on an allowed public/verification page.
  if (session && !session.user?.email_confirmed_at) {
    const allowedPaths = ['/verify-email', '/verify', '/terms', '/privacy', '/login', '/signup', '/logout']
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/verify-email" replace />
    }
  }

  // Only show Right Sidebar on Home and Search pages to reduce clutter
  const showRightSidebar = ['/', '/search'].includes(location.pathname)

  // Pages that should not show the auth modal
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/login-otp', '/verify-email', '/terms', '/privacy']
  const showAuthModal = !session && !authPages.includes(location.pathname)

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans">
      {/* Auth Modal for non-logged users */}
      {showAuthModal && <AuthModal />}
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

// Protected Route Guard
const RequireAuth = ({ session, children }) => {
  const location = useLocation()

  console.log('RequireAuth Check:', {
    hasSession: !!session,
    emailConfirmedAt: session?.user?.email_confirmed_at,
    user: session?.user
  })

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Strict Email Verification Check
  if (!session.user?.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />
  }

  return children
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
      // Only update if the access token has actually changed
      setSession(prev => {
        if (prev?.access_token !== newSession?.access_token) {
          return newSession
        }
        return prev
      })

      // Global Automation Check (e.g. Incomplete Profile)
      if (newSession?.user) {
        import('./services/automationService').then(service => {
          service.checkAndTriggerAutomations(newSession.user.id, 'incomplete_profile')
        })
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading CodeKrafts..." />
  }

  return (
    <FeatureProvider session={session}>
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
            <Route path="users" element={<UserList />} />
            <Route path="storage" element={<StorageCleanup />} />
            <Route path="tags" element={<TagManager />} />
            <Route path="verification-requests" element={<VerificationRequests />} />
            <Route path="media-review" element={<MediaReview />} />
            <Route path="users/:userId" element={<UserManager />} />
            <Route path="monitor" element={<UserMonitor />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="features" element={<FeatureManager />} />
            <Route path="email" element={<EmailComposer />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="ads" element={<AdminAdManager />} />
            <Route path="ads/:campaignId" element={<AdminCampaignDetails />} />
            <Route path="beta" element={<BetaManager />} />
            <Route path="releases" element={<ReleaseManager />} />
            <Route path="prompt-settings" element={<PromptSettings />} />
            <Route path="table/:tableName" element={<TableViewer />} />
          </Route>

          {/* Advertiser Routes */}
          <Route path="/advertiser">
            <Route path="dashboard" element={session ? <AdvertiserDashboard session={session} /> : <Navigate to="/login" />} />
            <Route path="create-campaign" element={session ? <CreateCampaign session={session} /> : <Navigate to="/login" />} />
            <Route path="campaign/:id" element={session ? <CampaignDetails session={session} /> : <Navigate to="/login" />} />
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
            <Route path="/verify" element={<VerifyEmailToken />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Public/Private Routes */}
            <Route path="/user/:userId" element={<PublicProfile session={session} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/post/:postId" element={<PostDetails session={session} />} />

            {/* Protected Routes */}
            <Route
              path="/create"
              element={<RequireAuth session={session}><CreatePost /></RequireAuth>}
            />
            <Route
              path="/profile"
              element={<RequireAuth session={session}><UserProfile /></RequireAuth>}
            />
            <Route
              path="/settings"
              element={<RequireAuth session={session}><Settings session={session} /></RequireAuth>}
            />
            <Route
              path="/get-verified"
              element={<RequireAuth session={session}><GetVerified session={session} /></RequireAuth>}
            />
            <Route
              path="/bookmarks"
              element={<RequireAuth session={session}><Bookmarks session={session} /></RequireAuth>}
            />
            <Route
              path="/referrals"
              element={<RequireAuth session={session}><Referrals session={session} /></RequireAuth>}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </FeatureProvider>
  )
}