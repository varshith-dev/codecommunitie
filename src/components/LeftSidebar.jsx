import React from 'react'
import { Home, Search, PlusSquare, User, Zap, Settings, LogOut, Bookmark, BookMarked, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Avatar from './Avatar'

export default function LeftSidebar({ session }) {
    const location = useLocation()
    const path = location.pathname

    const isActive = (p) => path === p
    const [userRole, setUserRole] = React.useState(null)

    React.useEffect(() => {
        if (session?.user) {
            supabase.from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()
                .then(({ data }) => setUserRole(data?.role))
        }
    }, [session])

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Explore', path: '/search' },
        { icon: BookMarked, label: 'Bookmarks', path: '/bookmarks' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ]

    return (
        <aside className="hidden md:flex flex-col h-screen sticky top-0 pt-8 pb-4 pr-6">
            {/* Logo */}
            <div className="mb-8 px-4">
                <Link to="/" className="flex items-center gap-2 text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
                    <span className="text-3xl">⚡</span> CodeKrafts
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive(item.path)
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <item.icon size={26} strokeWidth={isActive(item.path) ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                        <span className="text-lg">{item.label}</span>
                    </Link>
                ))}

                {/* Dynamic Button based on Role */}
                {userRole === 'advertiser' ? (
                    <Link
                        to="/advertiser/dashboard"
                        className="flex items-center gap-4 px-4 py-3.5 mt-8 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        <Megaphone size={26} />
                        <span className="text-lg">Ad Dashboard</span>
                    </Link>
                ) : (
                    <Link
                        to="/create"
                        className="flex items-center gap-4 px-4 py-3.5 mt-8 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        <PlusSquare size={26} />
                        <span className="text-lg">Create Post</span>
                    </Link>
                )}
            </nav>

            {/* User Mini Profile */}
            {session && (
                <div className="mt-auto px-4 py-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 flex items-center gap-3">
                    <Avatar src={session.user?.user_metadata?.avatar_url} alt="User" size="sm" />
                    <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-gray-900 truncate text-sm">{session.user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                </div>
            )}
        </aside>
    )
}
