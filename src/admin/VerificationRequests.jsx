import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Avatar from '../components/Avatar'
import { Check, X, ShieldAlert, BadgeCheck, Search, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function VerificationRequests() {
    const [requests, setRequests] = useState([])
    const [verifiedUsers, setVerifiedUsers] = useState([])
    const [activeTab, setActiveTab] = useState('verified') // 'requests' or 'verified'
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500) // Debounce search
        return () => clearTimeout(timer)
    }, [activeTab, searchQuery])

    const fetchData = async () => {
        setLoading(true)
        if (activeTab === 'verified') {
            try {
                let query = supabase
                    .from('profiles')
                    .select('*')
                    .eq('is_verified', true)

                if (searchQuery) {
                    query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                }

                // Try fetching with sort
                const { data, error } = await query
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (error) throw error
                setVerifiedUsers(data || [])
            } catch (err) {
                console.warn('Initial fetch failed, retrying without sort:', err)
                // Fallback: fetch without sort if created_at is missing
                let retryQuery = supabase
                    .from('profiles')
                    .select('*')
                    .eq('is_verified', true)

                if (searchQuery) {
                    retryQuery = retryQuery.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                }

                const { data, error: retryError } = await retryQuery.limit(50)

                if (retryError) {
                    toast.error('Failed to load verified users')
                    console.error(retryError)
                } else {
                    setVerifiedUsers(data || [])
                }
            }
        } else {
            // Fetch Pending Requests
            try {
                // Note: Searching on joined tables (profiles) is harder with simple query builder
                // We'll fetch pending requests and filter in correct order
                // If search query exists, we probably need to search profiles first or just client-side filter for now as requests are few

                let query = supabase
                    .from('verification_requests')
                    .select('*, profiles:user_id (id, username, display_name, profile_picture_url)')
                    .eq('status', 'pending')
                    .order('requested_at', { ascending: false })

                const { data, error } = await query

                if (error) throw error

                let filteredData = data || []
                if (searchQuery) {
                    const lowerQuery = searchQuery.toLowerCase()
                    filteredData = filteredData.filter(req =>
                        req.profiles?.username?.toLowerCase().includes(lowerQuery) ||
                        req.profiles?.display_name?.toLowerCase().includes(lowerQuery)
                    )
                }

                setRequests(filteredData)
            } catch (err) {
                console.warn('Sort by requested_at failed, retrying without sort:', err)
                // Fallback: Fetch without sort
                const { data: retryData, error: retryError } = await supabase
                    .from('verification_requests')
                    .select('*, profiles:user_id (id, username, display_name, profile_picture_url)')
                    .eq('status', 'pending')

                if (retryError) {
                    console.error('Retry failed:', retryError)
                    toast.error('Failed to load validation requests')
                } else {
                    let filteredData = retryData || []
                    if (searchQuery) {
                        const lowerQuery = searchQuery.toLowerCase()
                        filteredData = filteredData.filter(req =>
                            req.profiles?.username?.toLowerCase().includes(lowerQuery) ||
                            req.profiles?.display_name?.toLowerCase().includes(lowerQuery)
                        )
                    }
                    setRequests(filteredData)
                }
            }
        }
        setLoading(false)
    }

    const handleApprove = async (request) => {
        try {
            // 1. Verify the user
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', request.user_id)

            if (profileError) throw profileError

            // 2. Update request status
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({ status: 'approved' })
                .eq('id', request.id)

            if (reqError) throw reqError

            toast.success('User Verified Successfully')
            setRequests(prev => prev.filter(r => r.id !== request.id))

            // 3. AUTO-SEND EMAIL
            try {
                const userEmail = request.email // Verification requests usually have the email stored
                const userName = request.profiles?.display_name || 'Developer'

                // If email is missing in request (older data), fallback might be needed but for now assuming it's there
                if (userEmail) {
                    const { EmailService } = await import('../services/EmailService')
                    const { EmailTemplates, wrapInTemplate } = await import('../services/EmailTemplates')

                    const template = EmailTemplates.VERIFIED_BADGE
                    const html = wrapInTemplate(template.body(userName))

                    await EmailService.send({
                        recipientEmail: userEmail,
                        memberName: userName,
                        subject: template.subject(userName),
                        htmlContent: html,
                        templateType: 'VERIFIED_BADGE',
                        triggeredBy: 'automation_verification'
                    })
                    toast.success('Verification email sent!')
                }
            } catch (emailErr) {
                console.error('Failed to send verification email', emailErr)
                toast.error('User verified, but email failed to send.')
            }

        } catch (err) {
            console.error(err)
            toast.error('Approval failed')
        }
    }

    const handleReject = async (requestId) => {
        const reason = window.prompt('Reason for rejection (optional):')
        if (reason === null) return // Cancelled

        try {
            const { error } = await supabase
                .from('verification_requests')
                .update({ status: 'rejected', admin_notes: reason })
                .eq('id', requestId)

            if (error) throw error

            toast.success('Request Rejected')
            setRequests(prev => prev.filter(r => r.id !== requestId))
        } catch (err) {
            console.error(err)
            toast.error('Rejection failed')
        }
    }

    const revokeVerification = async (id) => {
        if (!window.confirm('Are you sure you want to revoke verification for this user?')) return

        const { error } = await supabase
            .from('profiles')
            .update({ is_verified: false })
            .eq('id', id)

        if (error) {
            toast.error('Failed to revoke')
        } else {
            toast.success('Verification Revoked')
            setVerifiedUsers(prev => prev.filter(u => u.id !== id))
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="text-blue-600" /> Verification Controls
                </h1>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm"
                        />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab('verified')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'verified' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Verified Accounts
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'requests' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Pending
                            {requests.length > 0 && <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading data...</div>
            ) : activeTab === 'requests' ? (
                requests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Pending Requests</h3>
                        <p className="text-gray-500">All verification requests have been processed.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm">
                                <div className="flex-shrink-0">
                                    <Avatar src={req.profiles?.profile_picture_url} size="lg" />
                                </div>
                                <div className="flex-1 text-center sm:text-left min-w-0">
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <h3 className="font-bold text-gray-900 truncate">{req.profiles?.display_name || 'Unknown User'}</h3>
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                                            @{req.profiles?.username}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 italic">"{req.message || 'No message provided'}"</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Requested: {new Date(req.requested_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        className="flex-1 sm:flex-none bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {verifiedUsers.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded border border-gray-200">
                            No verified users found.
                        </div>
                    ) : verifiedUsers.map(user => (
                        <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4">
                            <Avatar src={user.profile_picture_url} size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <h3 className="font-bold text-gray-900 truncate">{user.display_name}</h3>
                                    <BadgeCheck size={16} className="text-blue-500 flex-shrink-0" fill="currentColor" color="white" />
                                </div>
                                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>

                                <div className="mt-3 flex gap-2">
                                    <Link to={`/admin/users/${user.id}`} className="flex-1 bg-gray-50 text-gray-700 text-xs font-medium py-1.5 rounded text-center hover:bg-gray-100">
                                        Manage
                                    </Link>
                                    <button
                                        onClick={() => revokeVerification(user.id)}
                                        className="flex-1 bg-red-50 text-red-600 text-xs font-medium py-1.5 rounded text-center hover:bg-red-100"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
