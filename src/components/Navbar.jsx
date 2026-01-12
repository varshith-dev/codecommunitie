import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Home, PlusSquare, User, LogOut, Code2, Search as SearchIcon, Settings, Bookmark } from 'lucide-react'
import Avatar from './Avatar'
import UserBadges from './UserBadges'

export default function Navbar({ session, isMobile = false }) {
  const location = useLocation()
  const [profile, setProfile] = useState(null)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('profile_picture_url, username, display_name, is_verified, role')
        .eq('id', session.user.id)
        .single()

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut()
    }
  }

  // === MOBILE LAYOUT ===
  if (isMobile) {
    return (
      <nav className="w-full h-16 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">CodeKrafts</span>
        </Link>

        {/* Mobile Profile Actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link to="/settings" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings size={22} className="text-gray-600" />
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-full">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    )
  }

  // === DESKTOP LAYOUT ===
  return (
    <>
      <nav className="fixed top-0 w-full bg-white border-b border-gray-100 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group mr-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">CodeKrafts</span>
          </Link>

          {/* Center/Right Nav Items */}
          <div className="flex-1 flex items-center justify-end gap-1">

            {/* Main Links */}
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link
              to="/search"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive('/search') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <SearchIcon size={18} />
              <span>Search</span>
            </Link>

            {session && (
              <>
                <Link
                  to="/create"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive('/create') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <PlusSquare size={18} />
                  <span>Create</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2 py-1 transition-opacity hover:opacity-80"
                >
                  <div className="w-8 h-8 rounded-full border-[3px] border-green-500 overflow-hidden bg-white">
                    <Avatar src={profile?.profile_picture_url} size="full" alt="Me" />
                  </div>
                  <div className="flex items-center gap-1 max-w-[150px]">
                    <span className="truncate font-semibold text-gray-700 text-sm">
                      {profile?.username || 'Profile'}
                    </span>
                    <div className="flex-shrink-0">
                      <UserBadges user={profile} />
                    </div>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive('/settings') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/bookmarks"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive('/bookmarks') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Bookmark size={18} />
                  <span>Saved</span>
                </Link>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200 mx-2"></div>

                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <span>Sign Out</span>
                </button>
              </>
            )}

            {!session && (
              <Link to="/login" className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors ml-4">
                Sign In
              </Link>
            )}

          </div>
        </div>
      </nav>
    </>
  )
}