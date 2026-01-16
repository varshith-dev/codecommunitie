import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmail } from '../services/authService'
import toast from 'react-hot-toast'
import { Mail, Lock, LogIn, Code2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)

        try {
            const { user, error } = await signInWithEmail(email, password)

            if (error) {
                // Check for email verification error
                if (error.code === 'EMAIL_NOT_VERIFIED') {
                    toast.error('Please verify your email before logging in')
                    // Redirect to verification page with email prefilled
                    navigate('/verify-email', { state: { email: error.userEmail || email } })
                    return
                }

                if (error.message?.includes('Invalid login credentials')) {
                    toast.error('Invalid email or password')
                } else if (error.message?.includes('Email not confirmed')) {
                    toast.error('Please verify your email before logging in')
                    navigate('/verify-email', { state: { email } })
                } else {
                    toast.error(error.message || 'Login failed')
                }
                return
            }

            if (user) {
                // Trigger "Login" Automations
                try {
                    const { data: automations } = await import('../supabaseClient').then(m => m.supabase)
                        .from('prompt_automations')
                        .select('*')
                        .eq('trigger_type', 'login')
                        .eq('is_active', true)

                    if (automations && automations.length > 0) {
                        for (const auto of automations) {
                            // Insert Prompt
                            await import('../supabaseClient').then(m => m.supabase)
                                .from('user_prompts')
                                .insert({
                                    user_id: user.id,
                                    title: auto.title,
                                    message: auto.message,
                                    icon: auto.icon,
                                    type: auto.type,
                                    action_label: auto.action_label,
                                    action_url: auto.action_url
                                })

                            // Send Email if enabled
                            if (auto.email_enabled) {
                                await fetch('/api/send-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        recipientEmail: email,
                                        subject: auto.email_subject,
                                        htmlContent: auto.email_body
                                    })
                                }).catch(err => console.error('Auto-email failed', err))
                            }
                        }
                    }
                } catch (err) {
                    console.error('Automation error:', err)
                }

                toast.success('Welcome back!')
                navigate('/')
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Code2 size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">CodeKrafts</h1>
                    </div>
                    <p className="text-gray-500">Sign in to your account</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* OTP Login Option */}
                    <Link
                        to="/login-otp"
                        className="block w-full text-center py-3 px-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                        Sign in with OTP
                    </Link>

                    {/* Sign Up Link */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                            Sign up for free
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-gray-500">
                    By signing in, you agree to our{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    )
}
