import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { EmailService } from '../services/EmailService'
import toast from 'react-hot-toast'
import { Lock, Code2, KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
    const navigate = useNavigate()
    const location = useLocation()

    const email = location.state?.email || ''
    const [step, setStep] = useState('verify-otp') // 'verify-otp' or 'set-password'

    // OTP Verification State
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [verifying, setVerifying] = useState(false)

    // Password Reset State
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [resetting, setResetting] = useState(false)

    // Redirect if no email
    if (!email) {
        navigate('/forgot-password')
        return null
    }

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(0, 1)
        if (!/^\d*$/.test(value)) return // Only digits

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus()
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus()
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()

        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code')
            return
        }

        setVerifying(true)

        try {
            const { success, error } = await EmailService.verifyResetOTP(email, otpCode)

            if (error) {
                toast.error(error || 'Invalid or expired code')
                return
            }

            if (success) {
                toast.success('Code verified! Set your new password.')
                setStep('set-password')
            }
        } catch (error) {
            console.error('OTP verification error:', error)
            toast.error('Failed to verify code. Please try again.')
        } finally {
            setVerifying(false)
        }
    }

    const handleResendOtp = async () => {
        try {
            const { success } = await EmailService.sendResetOTP(email)
            if (success) {
                toast.success('New code sent to your email!')
                setOtp(['', '', '', '', '', ''])
                document.getElementById('otp-0')?.focus()
            }
        } catch (error) {
            toast.error('Failed to resend code')
        }
    }

    const handleResetPassword = async (e) => {
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

        setResetting(true)

        try {
            const otpCode = otp.join('')
            const { success, error } = await EmailService.resetPasswordWithOTP(email, otpCode, password)

            if (error) {
                toast.error(error || 'Failed to reset password')
                return
            }

            if (success) {
                toast.success('Password updated successfully! Redirecting to login...')
                setTimeout(() => navigate('/login'), 2000)
            }
        } catch (error) {
            console.error('Password reset error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setResetting(false)
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {step === 'verify-otp' ? 'Verify Code' : 'Set New Password'}
                    </h2>
                    <p className="text-gray-600">
                        {step === 'verify-otp'
                            ? `We sent a 6-digit code to ${email}`
                            : 'Enter your new password below'
                        }
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
                    {step === 'verify-otp' ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            {/* OTP Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                                    Enter 6-Digit Code
                                </label>
                                <div className="flex gap-2 justify-center">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            disabled={verifying}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={verifying || otp.join('').length !== 6}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {verifying ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Verify Code
                                    </>
                                )}
                            </button>

                            {/* Resend Code */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Didn't receive the code? Resend
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                        minLength={6}
                                        disabled={resetting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                        disabled={resetting}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={resetting}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {resetting ? (
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
