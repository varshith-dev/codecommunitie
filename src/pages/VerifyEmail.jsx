import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { EmailService } from '../services/EmailService'
import { supabase } from '../supabaseClient'

export default function VerifyEmail() {
    const location = useLocation()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [step, setStep] = useState('input') // 'input' | 'verify' | 'verified'
    const [loading, setLoading] = useState(false)
    const [userDetected, setUserDetected] = useState(false)

    // Auto-detect logged-in user's email and state
    useEffect(() => {
        const loadUserEmail = async () => {
            // First try to get email from navigation state (just signed up)
            if (location.state?.email) {
                setEmail(location.state.email)
                setUserDetected(true)

                // If we just sent the OTP from Signup, switch directly to verify step
                if (location.state?.otpSent) {
                    setStep('verify')
                }
                return
            }

            // Otherwise, check if user is logged in
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.email) {
                setEmail(session.user.email)
                setUserDetected(true)

                if (session.user.email_confirmed_at) {
                    setStep('verified')
                }
            }
        }
        loadUserEmail()
    }, [location.state, navigate])


    const handleSendOTP = async () => {
        if (!email) {
            toast.error('Please enter your email')
            return
        }
        setLoading(true)
        try {
            await EmailService.sendOTP(email)
            toast.success(`Code sent to ${email}`)
            setStep('verify')
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        const code = otp.join('')
        if (code.length !== 6) {
            toast.error('Please enter the 6-digit code')
            return
        }
        setLoading(true)
        try {
            await EmailService.verifyOTP(email, code)
            toast.success('Email Verified Successfully!')
            navigate('/login')
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {step === 'input' ? <Mail className="text-blue-600" size={32} /> : <KeyRound className="text-blue-600" size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verify Email</h1>
                    <p className="text-gray-500 mt-2">
                        {step === 'input'
                            ? "We'll send a code to your email to verify your account."
                            : `Enter the 6-digit code sent to ${email}`
                        }
                    </p>
                </div>

                {step === 'input' ? (
                    <div className="space-y-4">
                        {userDetected && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                                ✓ Email detected from your account
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="name@example.com"
                                readOnly={userDetected}
                            />
                        </div>

                        <button
                            onClick={handleSendOTP}
                            disabled={loading || !email}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Send Verification Code <ArrowRight size={18} /></>}
                        </button>
                    </div>
                ) : step === 'verify' ? (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`otp-${i}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !digit && i > 0) {
                                            document.getElementById(`otp-${i - 1}`).focus()
                                        }
                                    }}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 outline-none transition-all bg-gray-50"
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Verify & Login <CheckCircle size={18} /></>}
                        </button>

                        <button
                            onClick={handleSendOTP} // Resend logic reuses sendOTP
                            disabled={loading}
                            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Resend Code
                        </button>

                        <button
                            onClick={() => setStep('input')}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            Use different email
                        </button>
                    </div>
                ) : step === 'verified' ? (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-green-600" size={48} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                            <p className="text-gray-600">
                                Your email <span className="font-semibold text-blue-600">{email}</span> has been successfully verified.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Go to Home <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-sm font-medium text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
