import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePassword } from '../services/authService'
import toast from 'react-hot-toast'
import { Lock, CheckCircle, XCircle } from 'lucide-react'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [hasAccess, setHasAccess] = useState(false)

    useEffect(() => {
        // Check if user has valid reset token
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
            setHasAccess(true)
        } else {
            toast.error('Invalid or expired reset link')
            setTimeout(() => navigate('/forgot-password'), 2000)
        }
    }, [navigate])

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

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.password || !formData.confirmPassword) {
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

        setLoading(true)

        try {
            const { success, error } = await updatePassword(formData.password)

            if (error) {
                toast.error(error.message || 'Failed to reset password')
                return
            }

            if (success) {
                toast.success('Password updated successfully!')
                setTimeout(() => navigate('/login'), 2000)
            }
        } catch (error) {
            console.error('Reset password error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Validating reset link...</p>
                </div>
            </div>
        )
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-600">Enter your new password below</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !passwordsMatch}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
