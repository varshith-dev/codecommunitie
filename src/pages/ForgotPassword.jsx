import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmailService } from '../services/EmailService'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            const { success, message } = await EmailService.sendPasswordResetLink(email)

            if (success) {
                toast.success('Reset link sent! Check your email.')
                // Don't navigate - just show success message
            } else {
                toast.error(message || 'Failed to send reset link')
            }
        } catch (error) {
            console.error('Reset error:', error)
            toast.error(error.message || 'Something went wrong. Please try again.')
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">No worries, we'll send you a code to reset it.</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-scale-in">
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
                                    Sending Code...
                                </>
                            ) : (
                                'Send Reset Code'
                            )}
                        </button>
                    </form>

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
