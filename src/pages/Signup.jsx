import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpWithEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react'

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

        // Validation
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
                    display_name: formData.username
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
                toast.success('Account created! Please check your email to verify.')
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
            <div className="w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💻</span>
                        </div>
                        <h1 className="text-3xl font-bold gradient-text">CodeKrafts</h1>
                    </div>
                    <p className="text-gray-600">Create your account and start sharing</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                    required
                                />
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
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    disabled={loading}
                                    required
                                />
                                {formData.confirmPassword && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <CheckCircle className="text-green-500" size={20} />
                                        ) : (
                                            <XCircle className="text-red-500" size={20} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <label className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                                I agree to the{' '}
                                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreedToTerms}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
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
