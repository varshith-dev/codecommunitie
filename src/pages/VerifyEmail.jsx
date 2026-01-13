import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { resendVerificationEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, CheckCircle } from 'lucide-react'

export default function VerifyEmail() {
    const location = useLocation()
    const [emailInput, setEmailInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const emailToUse = location.state?.email || emailInput

    useEffect(() => {
        // Only show error if no email is available in either place
        // and user tries to interact? No, let's just be silent if they land here without email.
    }, [])

    const handleResend = async () => {
        if (countdown > 0 || loading) return

        if (!emailToUse) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            const { success, error } = await resendVerificationEmail(emailToUse)

            if (error) {
                toast.error(error.message || 'Failed to resend verification email')
                return
            }

            // Send Verification Reminder via Custom Service
            try {
                const { EmailService } = await import('../services/EmailService')
                const { EmailTemplates, wrapInTemplate } = await import('../services/EmailTemplates')

                // 1. Generate Secure Link (Redirect to Home/Dashboard)
                const verificationLink = await EmailService.generateVerificationLink(emailToUse, window.location.origin)

                // 2. Prepare Template
                const template = EmailTemplates.SIGNUP_CONFIRMATION
                const memberName = emailToUse.split('@')[0]
                const html = wrapInTemplate(
                    template.body(memberName, verificationLink || undefined),
                    template.title
                )

                // 3. Send Email
                await EmailService.send({
                    recipientEmail: emailToUse,
                    memberName: memberName,
                    subject: template.subject(memberName),
                    htmlContent: html,
                    templateType: 'SIGNUP_CONFIRMATION',
                    triggeredBy: 'resend_verification'
                })
            } catch (emailErr) {
                console.error('Failed to send resend email:', emailErr)
            }

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
                    <div className="mb-6">
                        {location.state?.email ? (
                            <p className="text-lg font-semibold text-gray-900">
                                {location.state.email}
                            </p>
                        ) : (
                            <div className="max-w-xs mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full px-4 py-2 text-center border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

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
                            disabled={countdown > 0 || loading || (!location.state?.email && !emailInput)}
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
                            className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
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
