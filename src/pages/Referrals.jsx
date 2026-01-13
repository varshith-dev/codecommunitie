import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Gift, Copy, Check, Users, Share2, Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useFeature } from '../context/FeatureContext'
import BetaLabel from '../components/BetaLabel'

export default function Referrals({ session }) {
    const [loading, setLoading] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const [referralCode, setReferralCode] = useState(null)
    const [referralStats, setReferralStats] = useState({ uses: 0, maxUses: 10 })
    const [referredUsers, setReferredUsers] = useState([])
    const [copied, setCopied] = useState(false)
    const [generating, setGenerating] = useState(false)

    const { hasFeature, loading: featureLoading } = useFeature()
    const canRefer = hasFeature('referrals')

    useEffect(() => {
        if (!featureLoading && canRefer) {
            fetchReferralData()
        }
        setLoading(false)
    }, [featureLoading, canRefer])

    const fetchReferralData = async () => {
        try {
            // Get user's referral code
            const { data: referral } = await supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', session.user.id)
                .eq('is_active', true)
                .single()

            if (referral) {
                setReferralCode(referral.referral_code)
                setReferralStats({ uses: referral.uses_count, maxUses: referral.max_uses })

                // Get referred users
                const { data: uses } = await supabase
                    .from('referral_uses')
                    .select(`
                        used_at,
                        referred_user:referred_user_id (
                            username,
                            display_name,
                            profile_picture_url
                        )
                    `)
                    .eq('referral_id', referral.id)
                    .order('used_at', { ascending: false })

                setReferredUsers(uses || [])
            }
        } catch (error) {
            // No referral exists yet
            console.log('No referral code yet')
        }
    }

    const generateCode = async () => {
        setGenerating(true)
        try {
            // Generate a unique code (Use Username as requested)
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session.user.id)
                .single()

            const code = profile.username

            const { error } = await supabase
                .from('referrals')
                .insert({
                    referrer_id: session.user.id,
                    referral_code: code,
                    max_uses: 10
                })

            if (error) throw error

            setReferralCode(code)
            toast.success('Referral link generated!')
        } catch (error) {
            console.error('Error generating code:', error)
            toast.error('Failed to generate code')
        } finally {
            setGenerating(false)
        }
    }

    const copyCode = () => {
        const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Referral link copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        )
    }

    // No access - show locked state
    if (!featureLoading && !canRefer) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <Link to="/settings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeft size={18} />
                    Back to Settings
                </Link>

                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Program</h2>
                    <div className="mb-4">
                        <BetaLabel />
                    </div>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        The referral program is currently invite-only. Stay tuned for when we open it up to more users!
                    </p>
                    <Link
                        to="/settings"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Return to Settings
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
                            <BetaLabel />
                        </div>
                        <p className="text-sm text-gray-500">Invite friends and earn rewards</p>
                    </div>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Stats Banner */}
                <div className="bg-blue-600 text-white p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <Gift size={28} />
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Friends Invited</p>
                            <p className="text-3xl font-bold">{referralStats.uses} / {referralStats.maxUses}</p>
                        </div>
                    </div>
                </div>

                {/* Referral Code Section */}
                <div className="p-6">
                    {referralCode ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Your Referral Link
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-700 truncate">
                                    {window.location.origin}/signup?ref={referralCode}
                                </div>
                                <button
                                    onClick={copyCode}
                                    className={`px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            {/* Share Options */}
                            <div className="flex gap-2 pt-2">
                                <a
                                    href={`https://twitter.com/intent/tweet?text=Join%20me%20on%20CodeKrafts!%20${encodeURIComponent(window.location.origin)}/signup?ref=${referralCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
                                >
                                    Share on X
                                </a>
                                <a
                                    href={`https://wa.me/?text=Join%20me%20on%20CodeKrafts!%20${encodeURIComponent(window.location.origin)}/signup?ref=${referralCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium text-center transition-colors"
                                >
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Share2 size={28} className="text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Generate Your Referral Code</h3>
                            <p className="text-sm text-gray-500 mb-4">Share it with friends to invite them</p>
                            <button
                                onClick={generateCode}
                                disabled={generating}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {generating ? 'Generating...' : 'Generate Code'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Referred Users */}
                {referredUsers.length > 0 && (
                    <div className="border-t border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users size={18} />
                            People You Invited
                        </h3>
                        <div className="space-y-3">
                            {referredUsers.map((use, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                                        {use.referred_user?.display_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{use.referred_user?.display_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">@{use.referred_user?.username}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(use.used_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Share your unique referral link with friends</li>
                    <li>• When they sign up using your link, you get credit</li>
                    <li>• Earn rewards for successful referrals</li>
                </ul>
            </div>
        </div>
    )
}
