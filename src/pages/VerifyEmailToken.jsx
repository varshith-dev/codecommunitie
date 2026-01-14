import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Loader2, Mail, Clock } from 'lucide-react'

export default function VerifyEmailToken() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
    const [message, setMessage] = useState('')
    const [email, setEmail] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')

        if (!token) {
            setStatus('error')
            setMessage('Invalid verification link. No token provided.')
            return
        }

        verifyToken(token)
    }, [searchParams])

    const verifyToken = async (token) => {
        try {
            const response = await fetch('/api/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })

            const data = await response.json()

            if (data.success) {
                setStatus('success')
                setMessage(data.message)
                setEmail(data.email)

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Email verified! You can now login.',
                            email: data.email
                        }
                    })
                }, 3000)
            } else {
                setStatus('error')
                if (data.error === 'token_expired') {
                    setMessage('This verification link has expired. Please request a new one.')
                } else if (data.error === 'invalid_token') {
                    setMessage('Invalid verification link. Please request a new one.')
                } else {
                    setMessage(data.message || 'Verification failed. Please try again.')
                }
            }
        } catch (error) {
            console.error('Verification error:', error)
            setStatus('error')
            setMessage('Something went wrong. Please try again later.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Status Icon */}
                    <div className={`p-8 text-center ${status === 'verifying' ? 'bg-blue-50' :
                            status === 'success' ? 'bg-green-50' :
                                'bg-red-50'
                        }`}>
                        {status === 'verifying' && (
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                                <Loader2 className="text-blue-600 animate-spin" size={40} />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="text-green-600" size={40} />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                                <XCircle className="text-red-600" size={40} />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {status === 'verifying' && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                                    Verifying Your Email
                                </h1>
                                <p className="text-gray-600 text-center">
                                    Please wait while we verify your email address...
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <h1 className="text-2xl font-bold text-green-900 text-center mb-3">
                                    Email Verified!
                                </h1>
                                <p className="text-gray-700 text-center mb-6">
                                    {message}
                                </p>
                                {email && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center gap-2 text-green-800">
                                            <Mail size={18} />
                                            <span className="font-semibold">{email}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="text-center text-sm text-gray-500">
                                    <Clock size={16} className="inline mr-1" />
                                    Redirecting to login in 3 seconds...
                                </div>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <h1 className="text-2xl font-bold text-red-900 text-center mb-3">
                                    Verification Failed
                                </h1>
                                <p className="text-gray-700 text-center mb-6">
                                    {message}
                                </p>
                                <div className="space-y-3">
                                    <Link
                                        to="/verify-email"
                                        className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center transition-colors"
                                    >
                                        Request New Link
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-center transition-colors"
                                    >
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {status === 'success' && (
                        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                            <Link
                                to="/login"
                                className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
                            >
                                Go to Login Now
                            </Link>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Need help? <Link to="/contact" className="text-blue-600 hover:underline">Contact Support</Link>
                </p>
            </div>
        </div>
    )
}
