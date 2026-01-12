import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Home, PlusSquare, User, LogOut, Code2, BarChart3 } from 'lucide-react'
import Avatar from './Avatar'

export default function Navbar({ session }) {
  const location = useLocation()
  const [profile, setProfile] = useState(null)

  const isActive = (path) => location.pathname === path
    ? "text-blue-600"
    : "text-gray-600 hover:text-gray-900"

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('profile_picture_url, username, display_name')
        .eq('id', session.user.id)
        .single()

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* DESKTOP TOP BAR */}
      <nav className="fixed top-0 w-full glass border-b border-gray-200/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="hidden sm:block">CodeKrafts</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`flex items-center gap-2 font-medium transition-all hover:scale-105 ${isActive('/')}`}>
              <Home size={20} />
              <span>Home</span>
            </Link>

            {session && (
              <>
                <Link to="/create" className={`flex items-center gap-2 font-medium transition-all hover:scale-105 ${isActive('/create')}`}>
                  <PlusSquare size={20} />
                  <span>Create</span>
                </Link>

                <Link to="/admin" className={`flex items-center gap-2 font-medium transition-all hover:scale-105 ${isActive('/admin')}`}>
                  <BarChart3 size={20} />
                  <span>Dashboard</span>
                </Link>

                <Link to="/profile" className={`flex items-center gap-2 font-medium transition-all ${isActive('/profile')}`}>
                  <Avatar
                    src={profile?.profile_picture_url}
                    alt={profile?.display_name || profile?.username || 'User'}
                    size="sm"
                  />
                  <span>{profile?.display_name || profile?.username || 'Profile'}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all active:scale-95"
                >
                  <span className="hidden lg:inline">Sign Out</span>
                  <LogOut size={16} className="lg:hidden" />
                </button>
              </>
            )}

            {!session && (
              <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-md transition-all hover:shadow-lg hover:scale-105">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 w-full glass border-t border-gray-200/50 z-50 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          <Link to="/" className={`flex flex-col items-center p-2 min-w-[60px] transition-all ${isActive('/') ? 'text-blue-600 scale-110' : 'text-gray-500'}`}>
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Feed</span>
          </Link>

          {session && (
            <>
              <Link to="/create" className={`flex flex-col items-center p-2 min-w-[60px] transition-all ${isActive('/create') ? 'text-blue-600 scale-110' : 'text-gray-500'}`}>
                <div className={`p-2 rounded-full ${isActive('/create') ? 'bg-blue-100' : ''}`}>
                  <PlusSquare size={24} />
                </div>
                <span className="text-[10px] mt-1 font-medium">Post</span>
              </Link>

              <Link to="/admin" className={`flex flex-col items-center p-2 min-w-[60px] transition-all ${isActive('/admin') ? 'text-blue-600 scale-110' : 'text-gray-500'}`}>
                <BarChart3 size={24} />
                <span className="text-[10px] mt-1 font-medium">Stats</span>
              </Link>

              <Link to="/profile" className={`flex flex-col items-center p-2 min-w-[60px] transition-all ${isActive('/profile') ? 'text-blue-600 scale-110' : 'text-gray-500'}`}>
                <Avatar
                  src={profile?.profile_picture_url}
                  alt={profile?.display_name || profile?.username || 'User'}
                  size="sm"
                />
                <span className="text-[10px] mt-1 font-medium">Profile</span>
              </Link>

              <button onClick={handleLogout} className="flex flex-col items-center p-2 min-w-[60px] text-gray-500 hover:text-red-600 transition-all">
                <LogOut size={24} />
                <span className="text-[10px] mt-1 font-medium">Logout</span>
              </button>
            </>
          )}

          {!session && (
            <Link to="/login" className="flex flex-col items-center p-2 min-w-[60px] text-blue-600">
              <User size={24} />
              <span className="text-[10px] mt-1 font-medium">Login</span>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}