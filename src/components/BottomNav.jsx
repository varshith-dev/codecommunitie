import { Home, Search, PlusSquare, User, Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function BottomNav({ session }) {
    const location = useLocation()
    const path = location.pathname

    if (!session) return null

    const isActive = (p) => path === p

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe z-50 transition-all duration-300 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex justify-around items-center px-4 py-3">
                <Link to="/" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive('/') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Home size={26} strokeWidth={isActive('/') ? 2.5 : 2} className="transition-transform duration-300" />
                    {isActive('/') && <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-fade-in" />}
                </Link>

                <Link to="/search" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive('/search') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Search size={26} strokeWidth={isActive('/search') ? 2.5 : 2} className="transition-transform duration-300" />
                    {isActive('/search') && <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-fade-in" />}
                </Link>

                <Link to="/create" className="flex flex-col items-center justify-center -mt-6">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/40 active:scale-90 active:shadow-sm transition-all duration-300 hover:scale-105 hover:rotate-3 border-4 border-white">
                        <PlusSquare size={26} strokeWidth={2.5} />
                    </div>
                </Link>

                <Link to="/bookmarks" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive('/bookmarks') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <Zap size={26} fill={isActive('/bookmarks') ? "currentColor" : "none"} strokeWidth={isActive('/bookmarks') ? 2.5 : 2} className="transition-transform duration-300" />
                    {isActive('/bookmarks') && <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-fade-in" />}
                </Link>

                <Link to="/profile" className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive('/profile') ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600 active:scale-95'}`}>
                    <User size={26} strokeWidth={isActive('/profile') ? 2.5 : 2} className="transition-transform duration-300" />
                    {isActive('/profile') && <span className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full animate-fade-in" />}
                </Link>
            </div>
        </div>
    )
}
