import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Mail, AlertCircle, Clock, Send, RefreshCw, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function UnverifiedUsersPanel() {
    const [unverifiedUsers, setUnverifiedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState({})
    const [stats, setStats] = useState({
        total: 0,
        under24h: 0,
        over24h: 0,
        over7days: 0
    })

    useEffect(() => {
        loadUnverifiedUsers()

        // Refresh every 30 seconds
        const interval = setInterval(loadUnverifiedUsers, 30000)
        return () => clearInterval(interval)
    }, [])

    const loadUnverifiedUsers = async () => {
        try {
            setLoading(true)

            // Get all users from auth.users (requires admin access)
            const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

            if (usersError) throw usersError

            // Filter unverified users
            const unverified = users.filter(user => !user.email_confirmed_at)

            // Get profile data for each user
            const userIds = unverified.map(u => u.id)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, email')
                .in('id', userIds)

            // Combine data
            const combined = unverified.map(user => {
                const profile = profiles?.find(p => p.id === user.id)
                const createdAt = new Date(user.created_at)
                const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
                const daysSinceCreated = hoursSinceCreated / 24

                return {
                    id: user.id,
                    email: user.email || profile?.email,
                    username: profile?.username || 'Unknown',
                    created_at: user.created_at,
                    hours_unverified: Math.floor(hoursSinceCreated),
                    days_unverified: Math.floor(daysSinceCreated),
                    last_sign_in_at: user.last_sign_in_at
                }
            })

            // Sort by creation date (newest first)
            combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            setUnverifiedUsers(combined)

            // Calculate stats
            const under24h = combined.filter(u => u.hours_unverified < 24).length
            const over24h = combined.filter(u => u.hours_unverified >= 24 && u.days_unverified < 7).length
            const over7days = combined.filter(u => u.days_unverified >= 7).length

            setStats({
                total: combined.length,
                under24h,
                over24h,
                over7days
            })
        } catch (error) {
            console.error('Error loading unverified users:', error)
            toast.error('Failed to load unverified users')
        } finally {
            setLoading(false)
        }
    }

    const sendVerificationReminder = async (user) => {
        setSending(prev => ({ ...prev, [user.id]: true }))

        try {
            // Resend confirmation email via Supabase
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email
            })

            if (error) throw error

            // Create user prompt
            await supabase.from('automated_prompts').insert({
                user_id: user.id,
                prompt_type: 'verify_email',
                title: 'Verify Your Email',
                message: `Please verify your email to access all features. We sent a new confirmation link to ${user.email}`,
                icon: 'warning',
                btn_label: 'Verify Now',
                btn_color: 'blue',
                action_url: '/verify-email',
                status: 'sent',
                sent_at: new Date().toISOString()
            })

            // Log admin action
            await supabase.rpc('log_admin_action', {
                p_action_type: 'send_verification_reminder',
                p_target_user_id: user.id,
                p_action_details: { email: user.email }
            })

            toast.success(`Verification reminder sent to ${user.email}`)
        } catch (error) {
            console.error('Error sending reminder:', error)
            toast.error(error.message || 'Failed to send reminder')
        } finally {
            setSending(prev => ({ ...prev, [user.id]: false }))
        }
    }

    const sendBulkReminders = async () => {
        const usersOver24h = unverifiedUsers.filter(u => u.hours_unverified >= 24)

        if (usersOver24h.length === 0) {
            toast.error('No users over 24 hours unverified')
            return
        }

        if (!window.confirm(`Send verification reminders to ${usersOver24h.length} users?`)) {
            return
        }

        toast.loading('Sending bulk reminders...', { id: 'bulk' })

        let sent = 0
        let failed = 0

        for (const user of usersOver24h) {
            try {
                await sendVerificationReminder(user)
                sent++
            } catch (error) {
                failed++
            }
        }

        toast.success(`Sent ${sent} reminders, ${failed} failed`, { id: 'bulk' })
        loadUnverifiedUsers()
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-100 rounded"></div>
                    <div className="h-20 bg-gray-100 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Unverified</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Under 24h</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.under24h}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="text-yellow-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Over 24h</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.over24h}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Over 7 Days</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.over7days}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Mail size={24} className="text-blue-600" />
                            Unverified Users
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage users who haven't verified their email
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadUnverifiedUsers}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={sendBulkReminders}
                            disabled={stats.over24h === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                            Bulk Send ({stats.over24h})
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className="divide-y divide-gray-100">
                    {unverifiedUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            🎉 No unverified users! Everyone is verified.
                        </div>
                    ) : (
                        unverifiedUsers.map(user => (
                            <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.email}</p>
                                                <p className="text-sm text-gray-500">@{user.username}</p>
                                            </div>
                                            {user.days_unverified >= 7 && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                                    {user.days_unverified} days
                                                </span>
                                            )}
                                            {user.hours_unverified >= 24 && user.days_unverified < 7 && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                                    {user.hours_unverified}h
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Signed up {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => sendVerificationReminder(user)}
                                        disabled={sending[user.id]}
                                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {sending[user.id] ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send Reminder
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
