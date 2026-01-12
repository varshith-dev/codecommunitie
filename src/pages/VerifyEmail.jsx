import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { resendVerificationEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, CheckCircle } from 'lucide-react'

export default function VerifyEmail() {
    const location = useLocation()
    const email = location.state?.email || ''
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (!email) {
            toast.error('No email provided')
        }
    }, [email])

    const handleResend = async () => {
        if (countdown > 0 || loading) return

        setLoading(true)

        try {
            const { success, error } = await resendVerificationEmail()

            if (error) {
                toast.error(error.message || 'Failed to resend verification email')
                return
            }

            if (success) {
                setCountdown(60)
                toast.success('Verification email sent!')

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
            console.error('Resend error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
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
                </div>

                {/* Success Message */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                        <Mail className="text-blue-600" size={40} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>

                    <p className="text-gray-600 mb-2">
                        We've sent a verification link to
                    </p>
                    {email && (
                        <p className="text-lg font-semibold text-gray-900 mb-6">
                            {email}
                        </p>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-gray-700">
                                <p className="font-semibold mb-1">Next steps:</p>
                                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                    <li>Open your email inbox</li>
                                    <li>Click the verification link</li>
                                    <li>Return here and sign in</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Resend Option */}
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Didn't receive the email? Check your spam folder
                        </p>

                        <button
                            onClick={handleResend}
                            disabled={countdown > 0 || loading}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                'Sending...'
                            ) : countdown > 0 ? (
                                `Resend in ${countdown}s`
                            ) : (
                                'Resend verification email'
                            )}
                        </button>
                    </div>

                    {/* Sign In Link */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">
                            Already verified your email?
                        </p>
                        <Link
                            to="/login"
                            classname="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <p className="mt-6 text-center text-xs text-gray-500">
                    Having trouble?{' '}
                    <a href="mailto:support@codekrafts.com" className="text-blue-600 hover:underline">
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    )
}
