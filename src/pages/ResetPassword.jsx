import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { EmailService } from '../services/EmailService'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { Lock, Code2, KeyRound, Eye, EyeOff, ArrowLeft, XCircle } from 'lucide-react'

export default function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()

    // Check if there's a valid reset token in URL hash
    const [hasValidToken, setHasValidToken] = useState(null) // null = checking, true/false = result
    const [email, setEmail] = useState(location.state?.email || '')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Check for valid reset token on mount
    useEffect(() => {
        const checkResetToken = async () => {
            const hashParams = new URLSearchParams(location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const type = hashParams.get('type')

            // If there's an access_token and type=recovery, it's a valid reset link
            if (accessToken && type === 'recovery') {
                setHasValidToken(true)

                // Get session to pre-fill email
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user?.email) {
                    setEmail(session.user.email)
                }
            } else {
                // No valid reset token
                setHasValidToken(false)
            }
        }

        checkResetToken()
    }, [location])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            // Update password using Supabase Auth (works with the reset token in URL)
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            toast.success('Password updated successfully! Redirecting to login...')

            // Sign out and redirect to login
            await supabase.auth.signOut()
            setTimeout(() => navigate('/login'), 2000)
        } catch (error) {
            console.error('Reset password error:', error)
            toast.error(error.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Show loading while checking token
    if (hasValidToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating reset link...</p>
                </div>
            </div>
        )
    }

    // Show error if no valid token
    if (hasValidToken === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
                        <p className="text-gray-600 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <div className="space-y-3">
                            <Link
                                to="/forgot-password"
                                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Request New Reset Link
                            </Link>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Code2 size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">CodeKrafts</h1>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Set New Password</h2>
                    <p className="text-gray-500">Enter the code sent to your email and your new password.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <KeyRound size={20} />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
