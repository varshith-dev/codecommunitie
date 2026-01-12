import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendOTP, verifyOTP } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, Key, ArrowLeft } from 'lucide-react'

export default function LoginWithOTP() {
    const navigate = useNavigate()
    const [step, setStep] = useState('email') // 'email' or 'otp'
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const handleSendOTP = async (e) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            const { success, error } = await sendOTP(email)

            if (error) {
                toast.error(error.message || 'Failed to send OTP')
                return
            }

            if (success) {
                setStep('otp')
                setCountdown(60)
                toast.success('OTP sent to your email!')

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
            console.error('Send OTP error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault()

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        setLoading(true)

        try {
            const { user, error } = await verifyOTP(email, otp)

            if (error) {
                toast.error('Invalid or expired OTP')
                return
            }

            if (user) {
                toast.success('Welcome!')
                navigate('/')
            }
        } catch (error) {
            console.error('Verify OTP error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = () => {
        if (countdown > 0) return
        setOtp('')
        handleSendOTP(new Event('submit'))
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in with OTP</h2>
                    <p className="text-gray-600">
                        {step === 'email' ? 'Enter your email to receive an OTP' : 'Enter the code sent to your email'}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
                    {step === 'email' ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
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
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={20} />
                                        Send OTP
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Enter OTP
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('email')
                                            setOtp('')
                                            setCountdown(0)
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Change email
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Code sent to <span className="font-semibold">{email}</span>
                                </p>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-semibold"
                                        disabled={loading}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-3 text-center">
                                    Didn't receive the code?{' '}
                                    {countdown > 0 ? (
                                        <span className="text-gray-400">Resend in {countdown}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            className="text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify & Sign In'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            <span className="text-sm font-medium">Back to password login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
