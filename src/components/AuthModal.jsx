import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Code2, X, LogIn, UserPlus, Mail, Lock } from 'lucide-react'
import { signInWithEmail } from '../services/authService'
import toast from 'react-hot-toast'

export default function AuthModal({ onClose }) {
    const [mode, setMode] = useState('prompt') // 'prompt' | 'login'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            const { error } = await signInWithEmail(email, password)
            if (error) {
                toast.error(error.message || 'Login failed')
            } else {
                toast.success('Welcome back!')
                onClose?.()
            }
        } catch {
            toast.error('Something went wrong')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                {/* Close Button (optional - only if onClose is provided) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Header */}
                <div className="bg-blue-600 px-8 pt-10 pb-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Code2 size={36} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Welcome to CodeKrafts</h1>
                    <p className="text-blue-100 text-sm">
                        Join our developer community to share code and connect
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {mode === 'prompt' ? (
                        <>
                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Link
                                    to="/signup"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={20} />
                                    Create Account
                                </Link>
                                <button
                                    onClick={() => setMode('login')}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogIn size={20} />
                                    Sign In
                                </button>
                            </div>

                            {/* Features List */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-4">What you'll get:</p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Share code snippets with syntax highlighting
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Connect with developers worldwide
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
                                        Bookmark and save your favorite posts
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Quick Login Form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            Sign In
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setMode('prompt')}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    ← Back to options
                                </button>
                            </div>

                            <div className="mt-4 text-center text-sm">
                                <Link to="/forgot-password" className="text-blue-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
