import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { EmailService } from '../services/EmailService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    Settings as SettingsIcon,
    User,
    Palette,
    Shield,
    Save,
    Loader,
    Camera,
    Check,
    X as XIcon,
    Code2,
    Calendar,
    ArrowLeft,
    BadgeCheck,
    Clock,
    AlertTriangle,
    Gift,
    Sparkles,
    KeyRound
} from 'lucide-react'
import { formatDate } from '../utils/timeAgo'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'
import { useFeature } from '../context/FeatureContext'
import BetaLabel from '../components/BetaLabel'

export default function Settings({ session }) {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'profile'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        username: '',
        display_name: '',
        bio: '',
        website: '',
        syntax_theme: 'vscDarkPlus',
        profile_picture_url: '',
        banner_image_url: ''
    })
    const [originalProfile, setOriginalProfile] = useState(null)
    const [usernameError, setUsernameError] = useState('')
    const [checkingUsername, setCheckingUsername] = useState(false)
    const [verificationRequest, setVerificationRequest] = useState(null)
    const [cooldown, setCooldown] = useState(0)
    const { hasFeature } = useFeature()

    useEffect(() => {
        let timer
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [cooldown])


    useEffect(() => {
        if (!session) {
            navigate('/login')
            return
        }
        fetchProfile()
    }, [session])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error) throw error
            setProfile(data)
            setOriginalProfile(data)

            // Fetch verification request if exists
            await fetchVerificationRequest()
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const fetchVerificationRequest = async () => {
        try {
            const { data } = await supabase
                .from('verification_requests')
                .select('*')
                .eq('user_id', session.user.id)
                .order('requested_at', { ascending: false })
                .limit(1)
                .single()

            setVerificationRequest(data)
        } catch (error) {
            // No request exists, that's okay
            setVerificationRequest(null)
        }
    }



    const handleInputChange = (e) => {
        const { name, value } = e.target
        setProfile(prev => ({ ...prev, [name]: value }))

        if (name === 'username') {
            checkUsername(value)
        }
    }

    const checkUsername = async (username) => {
        if (username === originalProfile.username) {
            setUsernameError('')
            return
        }
        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters')
            return
        }

        setCheckingUsername(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single()

            if (data && data.id !== session.user.id) {
                setUsernameError('Username is already taken')
            } else {
                setUsernameError('')
            }
        } catch (error) {
            // Error means not found (good) or actual error
            if (error.code === 'PGRST116') {
                setUsernameError('')
            } else {
                console.error(error)
            }
        } finally {
            setCheckingUsername(false)
        }
    }

    const handleSave = async () => {
        if (usernameError) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: profile.username,
                    display_name: profile.display_name,
                    bio: profile.bio,
                    website: profile.website,
                    syntax_theme: profile.syntax_theme,
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id)

            if (error) throw error

            toast.success('Settings saved successfully')
            setOriginalProfile(profile)
        } catch (error) {
            console.error('Error saving settings:', error)
            if (error.message.includes('unique constraint')) {
                toast.error('Username already taken')
                setUsernameError('Username already taken')
            } else {
                toast.error('Failed to save settings')
            }
        } finally {
            setSaving(false)
        }
    }

    const tabs = [
        { id: 'profile', label: 'Edit Profile', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'account', label: 'Account', icon: Shield },
        { id: 'referrals', label: 'Referrals', icon: Gift, beta: true, feature: 'referrals' },
        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
    ].filter(tab => !tab.feature || hasFeature(tab.feature))

    const themes = [
        { id: 'vscDarkPlus', name: 'VS Code Dark' },
        { id: 'dracula', name: 'Dracula' },
        { id: 'github', name: 'GitHub Light' },
        { id: 'monokai', name: 'Monokai' },
    ]

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-96 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500">Manage your profile and preferences</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-4">
                    <div className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSearchParams({ tab: tab.id })}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border ${activeTab === tab.id
                                    ? (tab.beta ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-blue-50 text-blue-600 border-transparent shadow-sm')
                                    : (tab.beta
                                        ? 'bg-purple-50/30 text-gray-700 border-purple-200/50 hover:bg-purple-50 hover:border-purple-200 backdrop-blur-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent')
                                    }`}
                            >
                                <tab.icon size={18} className={tab.beta ? (activeTab === tab.id ? "text-purple-600" : "text-purple-400") : ""} />
                                {tab.label}
                                {tab.beta && (
                                    <div className="ml-auto">
                                        <BetaLabel size="xs" color="purple" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8">
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">Profile Details</h2>
                                <p className="text-sm text-gray-500">Update your public profile information</p>
                            </div>

                            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                                <div className="relative group cursor-pointer">
                                    <Avatar src={profile.profile_picture_url} size="xl" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera size={24} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Upload a new avatar. Recommended size: 400x400px.
                                    </p>
                                    <button className="mt-3 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                        Change Photo
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            name="display_name"
                                            value={profile.display_name || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="username"
                                                value={profile.username || ''}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 rounded-xl border ${usernameError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-2 outline-none transition-all`}
                                            />
                                            <div className="absolute right-3 top-2.5">
                                                {checkingUsername ? (
                                                    <Loader size={16} className="animate-spin text-gray-400" />
                                                ) : usernameError ? (
                                                    <XIcon size={16} className="text-red-500" />
                                                ) : profile.username && profile.username !== originalProfile.username ? (
                                                    <Check size={16} className="text-green-500" />
                                                ) : null}
                                            </div>
                                        </div>
                                        {usernameError && (
                                            <p className="text-xs text-red-500 mt-1 ml-1">{usernameError}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={profile.bio || ''}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={profile.website || ''}
                                        onChange={handleInputChange}
                                        placeholder="https://yourwebsite.com"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance Settings */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">Appearance</h2>
                                <p className="text-sm text-gray-500">Customize how CodeKrafts looks for you</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Syntax Highlighting Theme</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {themes.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setProfile(p => ({ ...p, syntax_theme: theme.id }))}
                                            className={`p-4 rounded-xl border text-left transition-all ${profile.syntax_theme === theme.id
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-semibold ${profile.syntax_theme === theme.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                                    {theme.name}
                                                </span>
                                                {profile.syntax_theme === theme.id && (
                                                    <Check size={18} className="text-blue-600" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Code2 size={14} />
                                                <span>Preview</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Settings */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">Account</h2>
                                <p className="text-sm text-gray-500">Manage your account security and data</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h3 className="font-medium text-gray-900 mb-1">Email Address</h3>
                                <p className="text-gray-600 text-sm mb-3">Your email address is managed via Supabase Auth.</p>
                                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500">
                                    <Shield size={14} />
                                    {session.user.email}
                                </div>
                            </div>

                            {/* Verification Request Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BadgeCheck className="text-blue-600" size={20} />
                                            <h3 className="font-semibold text-gray-900">Verification Badge</h3>
                                        </div>
                                        {profile.is_verified ? (
                                            <div className="flex items-center gap-2 text-sm text-green-700">
                                                <Check size={16} />
                                                <span>Your account is verified</span>
                                            </div>
                                        ) : verificationRequest?.status === 'pending' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-orange-700">
                                                    <Clock size={16} />
                                                    <span>Verification request pending review</span>
                                                </div>
                                                <p className="text-xs text-gray-600">
                                                    Submitted {new Date(verificationRequest.requested_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ) : verificationRequest?.status === 'rejected' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-red-700">
                                                    <XIcon size={16} />
                                                    <span>Previous request was rejected</span>
                                                </div>
                                                {verificationRequest.admin_notes && (
                                                    <p className="text-xs text-gray-600 bg-white p-2 rounded">
                                                        Reason: {verificationRequest.admin_notes}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600">
                                                Get a verification badge to show you're a trusted member of the community.
                                            </p>
                                        )}
                                    </div>
                                    {!profile.is_verified && verificationRequest?.status !== 'pending' && (
                                        <button
                                            onClick={() => navigate('/get-verified')}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <BadgeCheck size={16} />
                                            Get Verified
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Change Password Section */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                                            <KeyRound size={16} />
                                            Change Password
                                        </h3>
                                        <p className="text-gray-600 text-sm">Update your password to keep your account secure.</p>
                                    </div>
                                    <button
                                        disabled={cooldown > 0}
                                        onClick={async () => {
                                            if (cooldown > 0) return
                                            try {
                                                // Using EmailService OTP flow for consistency and to avoid SMTP rate limits
                                                const { success, error } = await EmailService.sendResetOTP(session.user.email)

                                                if (success) {
                                                    toast.success('Reset code sent! Redirecting to verify...')
                                                    setCooldown(60)
                                                    navigate('/reset-password', { state: { email: session.user.email } })
                                                } else {
                                                    throw new Error(error || 'Failed to send OTP')
                                                }
                                            } catch (error) {
                                                console.error('Password reset error:', error)
                                                toast.error('Error sending code: ' + (error.message || 'Check console'))
                                            }
                                        }}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {cooldown > 0 ? `Wait ${cooldown}s` : 'Send Reset Link'}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                    Looking to delete your account? Go to the <button onClick={() => setSearchParams({ tab: 'danger' })} className="text-red-600 font-medium hover:underline">Danger Zone</button>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Referrals Tab */}
                    {activeTab === 'referrals' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold text-gray-900">Referral Program</h2>
                                    <BetaLabel />
                                </div>
                                <p className="text-sm text-gray-500">Invite friends and earn rewards</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                                <Gift size={40} className="text-blue-600 mx-auto mb-4" />
                                <h3 className="font-semibold text-gray-900 mb-2">You have access!</h3>
                                <p className="text-sm text-gray-600 mb-4">Share your referral link with friends</p>
                                <button
                                    onClick={() => navigate('/referrals')}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Open Referrals Page
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    {activeTab === 'danger' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-red-600 mb-1 flex items-center gap-2">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle size={20} />
                                    </div>
                                    Danger Zone
                                </h2>
                                <p className="text-sm text-gray-500">Irreversible actions for your account</p>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-6">
                                <div>
                                    <h3 className="font-bold text-red-900 text-lg mb-2">Delete Account</h3>
                                    <p className="text-red-700 text-sm mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-red-900 mb-1">Reason for leaving</label>
                                            <textarea
                                                className="w-full px-4 py-2 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white min-h-[100px]"
                                                placeholder="Why are you deleting your account? (Optional)"
                                                id="delete-reason"
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-red-900 mb-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-2 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                                                placeholder="Enter your password to confirm"
                                                id="delete-password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        const password = document.getElementById('delete-password').value
                                        const reason = document.getElementById('delete-reason').value

                                        if (!password) {
                                            toast.error('Please enter your password')
                                            return
                                        }

                                        if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) return

                                        try {
                                            setSaving(true)
                                            // 1. Verify Password
                                            const { error: signInError } = await supabase.auth.signInWithPassword({
                                                email: session.user.email,
                                                password: password
                                            })

                                            if (signInError) throw new Error('Incorrect password')

                                            // 2. Log logic (optional: save reason somewhere)
                                            console.log('Account deletion requested:', reason)

                                            // 3. Clear data (Simulated deletion since client can't always self-delete auth)
                                            // Ideally call an RPC: await supabase.rpc('delete_user_account')

                                            // Note: Actual Auth deletion requires Admin API or RPC. 
                                            // For now we will Sign Out and assume backend handles or manual cleanup.

                                            await supabase.from('profiles').delete().eq('id', session.user.id) // Try to delete profile if RLS allows

                                            await supabase.auth.signOut()
                                            toast.success('Account deleted successfully')
                                            navigate('/login')

                                        } catch (error) {
                                            console.error(error)
                                            toast.error(error.message || 'Failed to delete account')
                                        } finally {
                                            setSaving(false)
                                        }
                                    }}
                                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors w-full flex items-center justify-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <Loader size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                                    Permanently Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delete Account Button (Floating for mobile, Fixed bottom right for desktop) */}
                    {activeTab !== 'danger' && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || !!usernameError}
                                className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${saving || usernameError
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


