import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { signUpWithEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, Lock, User, CheckCircle, XCircle, Code2, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function Signup() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [referralCode, setReferralCode] = useState(null)
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const ref = searchParams.get('ref')
        if (ref) {
            setReferralCode(ref)
            // Optional: Store in localStorage in case they navigate away and come back
            localStorage.setItem('referral_code', ref)
        } else {
            // Check storage
            const storedRef = localStorage.getItem('referral_code')
            if (storedRef) setReferralCode(storedRef)
        }
    }, [searchParams])

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Password strength checker
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' }

        let strength = 0
        if (password.length >= 8) strength++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
        if (/\d/.test(password)) strength++
        if (/[^a-zA-Z\d]/.test(password)) strength++

        if (strength <= 1) return { strength, label: 'Weak', color: 'bg-red-500' }
        if (strength === 2) return { strength, label: 'Fair', color: 'bg-yellow-500' }
        if (strength === 3) return { strength, label: 'Good', color: 'bg-blue-500' }
        return { strength, label: 'Strong', color: 'bg-green-500' }
    }

    const passwordStrength = getPasswordStrength(formData.password)
    const passwordsMatch = formData.password && formData.password === formData.confirmPassword

    const handleSignup = async (e) => {
        e.preventDefault()

        if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        if (!agreedToTerms) {
            toast.error('Please agree to the Terms of Service')
            return
        }

        setLoading(true)

        try {
            const { user, error } = await signUpWithEmail(
                formData.email,
                formData.password,
                {
                    username: formData.username,
                    display_name: formData.username,
                    referral_code: referralCode // Pass referral code
                }
            )

            if (error) {
                if (error.message?.includes('already registered')) {
                    toast.error('This email is already registered')
                } else if (error.message?.includes('invalid email')) {
                    toast.error('Please enter a valid email address')
                } else {
                    toast.error(error.message || 'Signup failed')
                }
                return
            }

            if (user) {
                // Send custom verification email with secure token
                try {
                    const response = await fetch('/api/send-verification-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: formData.email,
                            userId: user.id
                        })
                    })

                    const data = await response.json()

                    if (data.success) {
                        toast.success('Account created! Check your email for verification link.')
                    } else {
                        toast.success('Account created! Please check your email for verification.')
                    }
                } catch (emailErr) {
                    console.error('Email send error:', emailErr)
                    toast.success('Account created! Please check your email for verification.')
                }

                navigate('/verify-email', { state: { email: formData.email } })
            }
        } catch (error) {
            console.error('Signup error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md py-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Code2 size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">CodeKrafts</h1>
                    </div>
                    <p className="text-gray-500">Create your account</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">At least 8 characters with uppercase, lowercase, and numbers</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                                    disabled={loading}
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {formData.confirmPassword && (
                                        <>
                                            {passwordsMatch ? (
                                                <CheckCircle className="text-green-500" size={20} />
                                            ) : (
                                                <XCircle className="text-red-500" size={20} />
                                            )}
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-gray-400 hover:text-gray-600 outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                                I agree to the{' '}
                                <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreedToTerms}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
