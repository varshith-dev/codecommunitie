import React from 'react'
import { Home, Search, PlusSquare, User, Zap, Megaphone } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function BottomNav({ session }) {
    const location = useLocation()
    const path = location.pathname

    if (!session) return null

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

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-lg border-t border-gray-100/50 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-end px-2 py-3">
                <Link to="/" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 w-16 ${isActive('/') ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} className={`transition-all duration-300 ${isActive('/') && 'drop-shadow-sm'}`} />
                    {isActive('/') && <span className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full animate-scale-in" />}
                </Link>

                <Link to="/search" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 w-16 ${isActive('/search') ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Search size={24} strokeWidth={isActive('/search') ? 2.5 : 2} className={`transition-all duration-300 ${isActive('/search') && 'drop-shadow-sm'}`} />
                    {isActive('/search') && <span className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full animate-scale-in" />}
                </Link>

                {userRole === 'advertiser' ? (
                    <Link to="/advertiser/dashboard" className="flex flex-col items-center justify-center -mt-8 mb-1">
                        <div className="bg-gradient-to-tr from-green-600 to-emerald-600 text-white p-4 rounded-full shadow-lg shadow-green-500/30 active:scale-90 active:shadow-sm transition-all duration-300 hover:scale-105 hover:rotate-3 ring-4 ring-white">
                            <Megaphone size={24} strokeWidth={2.5} />
                        </div>
                    </Link>
                ) : (
                    <Link to="/create" className="flex flex-col items-center justify-center -mt-8 mb-1">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 active:scale-90 active:shadow-sm transition-all duration-300 hover:scale-105 hover:rotate-3 ring-4 ring-white">
                            <PlusSquare size={24} strokeWidth={2.5} />
                        </div>
                    </Link>
                )}

                <Link to="/bookmarks" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 w-16 ${isActive('/bookmarks') ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Zap size={24} fill={isActive('/bookmarks') ? "currentColor" : "none"} strokeWidth={isActive('/bookmarks') ? 2.5 : 2} className={`transition-all duration-300 ${isActive('/bookmarks') && 'drop-shadow-sm'}`} />
                    {isActive('/bookmarks') && <span className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full animate-scale-in" />}
                </Link>

                <Link to="/profile" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 w-16 ${isActive('/profile') ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} className={`transition-all duration-300 ${isActive('/profile') && 'drop-shadow-sm'}`} />
                    {isActive('/profile') && <span className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full animate-scale-in" />}
                </Link>
            </div>
        </div>
    )
}
