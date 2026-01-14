import { BadgeCheck } from 'lucide-react'

export default function UserBadges({ user, showToOwner = true }) {
    if (!user) return null

    // Use role-based or direct boolean checks
    const isAdmin = user.is_admin || user.role === 'admin'
    const isModerator = user.is_moderator || user.role === 'moderator'
    const isAdvertiser = user.is_advertiser || user.role === 'advertiser'
    const isVerified = user.is_verified

    // PRIORITY 1: ADMIN (Red)
    if (isAdmin) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                ADMIN
            </span>
        )
    }

    // PRIORITY 2: ADVERTISER (Green - User Requested)
    if (isAdvertiser) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                ADVERTISER
            </span>
        )
    }

    // PRIORITY 3: MODERATOR (Purple - Changed from Green to distinguish from Advertiser)
    if (isModerator) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                MOD
            </span>
        )
    }

    // PRIORITY 4: VERIFIED (Blue Tick)
    if (isVerified) {
        return (
            <BadgeCheck
                size={18}
                className="text-blue-500 fill-blue-500"
                title="Verified Account"
            />
        )
    }

    return null
}
