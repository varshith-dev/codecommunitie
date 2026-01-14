import { BadgeCheck } from 'lucide-react'

export default function UserBadges({ user, showToOwner = true }) {
    if (!user) return null

    // Use role-based or direct boolean checks
    const isAdmin = user.is_admin || user.role === 'admin'
    const isModerator = user.is_moderator || user.role === 'moderator'
    const isAdvertiser = user.is_advertiser || user.role === 'advertiser'
    const isVerified = user.is_verified

    // PRIORITY 1: ADMIN (Gold Tick)
    if (isAdmin) {
        return (
            <BadgeCheck
                size={18}
                className="text-yellow-500 fill-yellow-500" // Gold
                title="Admin"
            />
        )
    }

    // PRIORITY 2: ADVERTISER (Green Tick)
    if (isAdvertiser) {
        return (
            <BadgeCheck
                size={18}
                className="text-green-500 fill-green-500" // Green
                title="Advertiser"
            />
        )
    }

    // PRIORITY 3: MODERATOR (Purple Tick)
    if (isModerator) {
        return (
            <BadgeCheck
                size={18}
                className="text-purple-500 fill-purple-500" // Purple
                title="Moderator"
            />
        )
    }

    // PRIORITY 4: VERIFIED (Blue Tick)
    if (isVerified) {
        return (
            <BadgeCheck
                size={18}
                className="text-blue-500 fill-blue-500" // Blue
                title="Verified"
            />
        )
    }

    return null
}
