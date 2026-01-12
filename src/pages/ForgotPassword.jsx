import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordReset } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            const { success, error } = await sendPasswordReset(email)

            if (error) {
                toast.error(error.message || 'Failed to send reset email')
                return
            }

            if (success) {
                setEmailSent(true)
                setCountdown(60)
                toast.success('Password reset link sent to your email!')

                // Start countdown
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer)
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            }
        } catch (error) {
            console.error('Reset error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = () => {
        if (countdown > 0) return
        setEmailSent(false)
        handleSubmit(new Event('submit'))
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💻</span>
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">CodeKrafts</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">No worries, we'll send you reset instructions</p>
                </div>

                {/* Form/Success Message */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                            <p className="text-gray-600">
                                We've sent a password reset link to<br />
                                <span className="font-semibold text-gray-900">{email}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Didn't receive the email?{' '}
                                {countdown > 0 ? (
                                    <span className="text-gray-400">Resend in {countdown}s</span>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        className="text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        Click to resend
                                    </button>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium">Back to login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
