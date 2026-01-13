import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Calendar, User, ArrowLeft, Loader, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomDatePicker from '../components/CustomDatePicker'

export default function GetVerified({ session }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [existingRequest, setExistingRequest] = useState(null)
    const [isVerified, setIsVerified] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        message: ''
    })

    useEffect(() => {
        if (!session) {
            navigate('/login')
            return
        }
        fetchStatus()
    }, [session])

    const fetchStatus = async () => {
        try {
            // 1. Check Profile Verification Status (Source of Truth)
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_verified')
                .eq('id', session.user.id)
                .single()

            if (profile) setIsVerified(profile.is_verified)

            // 2. Check for latest request
            const { data, error } = await supabase
                .from('verification_requests')
                .select('*')
                .eq('user_id', session.user.id)
                .order('requested_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setExistingRequest(data)
            }
        } catch (err) {
            // No existing request
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.full_name || !formData.date_of_birth) {
            toast.error('Please fill in all required fields')
            return
        }

        // Validate Age (e.g., must be 13+)
        const birthDate = new Date(formData.date_of_birth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }

        if (age < 13) {
            toast.error('You must be at least 13 years old to verify.')
            return
        }

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('verification_requests')
                .insert({
                    user_id: session.user.id,
                    full_name: formData.full_name,
                    email: session.user.email,
                    date_of_birth: formData.date_of_birth,
                    message: formData.message || `Verification request from ${formData.full_name}`,
                    status: 'pending'
                })

            if (error) throw error

            toast.success('Request Submitted Successfully!')
            fetchStatus()
        } catch (error) {
            console.error(error)
            toast.error('Failed to submit request: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-600" /></div>

    return (
        <div className="max-w-2xl mx-auto pb-20 px-4">
            <button
                onClick={() => navigate('/settings?tab=account')}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} /> Back to Settings
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                    <BadgeCheck size={64} className="mx-auto mb-4 text-white/90" />
                    <h1 className="text-3xl font-bold mb-2">Get Verified</h1>
                    <p className="text-blue-100 max-w-sm mx-auto">
                        Verify your identity to get the blue checkmark and unlock exclusive features.
                    </p>
                </div>

                <div className="p-8">
                    {isVerified ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">You're Verified!</h2>
                            <p className="text-gray-500 mb-6">
                                Your account has been verified. You now have the blue checkmark badge on your profile.
                            </p>
                        </div>
                    ) : existingRequest && existingRequest.status === 'pending' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Loader size={32} className="animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Review in Progress</h2>
                            <p className="text-gray-500 mb-6">
                                We received your request on {new Date(existingRequest.requested_at).toLocaleDateString()}.<br />
                                Our team will review your information shortly.
                            </p>
                            <button disabled className="px-6 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed">
                                Request Pending
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {existingRequest && existingRequest.status === 'rejected' && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3">
                                    <XCircle className="shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="font-semibold">Previous Request Rejected</p>
                                        <p className="text-sm mt-1">{existingRequest.admin_notes || 'Please verify your information and try again.'}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name (as on ID)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-1">This will not be shown publicly.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                <div className="relative">
                                    <CustomDatePicker
                                        selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                                        onChange={(date) => setFormData({ ...formData, date_of_birth: date })}
                                        placeholderText="Select date of birth"
                                        showTimeSelect={false}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-1">Must be consistent with your government ID.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={session?.user?.email || ''}
                                    disabled
                                    className="w-full bg-gray-100 text-gray-500 border border-gray-300 rounded-lg p-3 text-sm cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                                <textarea
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                    placeholder="Any other links or info..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader className="animate-spin" /> : <BadgeCheck size={20} />}
                                Submit Request
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
