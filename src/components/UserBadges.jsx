import { BadgeCheck } from 'lucide-react'

export default function UserBadges({ user, showToOwner = true }) {
    if (!user) return null

    // Use role-based or direct boolean checks
    const isAdmin = user.is_admin || user.role === 'admin'
    const isModerator = user.is_moderator || user.role === 'moderator'
    const isAdvertiser = user.is_advertiser || user.role === 'advertiser'
    const isVerified = user.is_verified

    return (
        <div className="inline-flex items-center gap-1.5">
            {/* Verified Icon - Blue Checkmark */}
            {isVerified && (
                <BadgeCheck
                    size={18}
                    className="text-blue-500 fill-blue-500"
                    title="Verified Account"
                />
            )}

            {/* Admin Badge */}
            {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    ADMIN
                </span>
            )}

            {/* Moderator Badge */}
            {isModerator && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    MOD
                </span>
            )}

            {/* Advertiser Badge */}
            {isAdvertiser && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    ADVERTISER
                </span>
            )}
        </div>
    )
}
