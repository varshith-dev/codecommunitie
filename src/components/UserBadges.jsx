import VerifiedBadge from './VerifiedBadge'
import RoleBadge from './RoleBadge'

export default function UserBadges({ user }) {
    if (!user) return null

    const role = user.role || 'user'
    const isVerified = user.is_verified

    // Advertisers, Moderators, and Admins get verification ticks
    const showVerificationTick = role === 'advertiser' || role === 'moderator' || role === 'admin'

    // If user has a special role, show the verification tick with role color
    if (showVerificationTick) {
        return <VerifiedBadge size={16} role={role} />
    }

    // Regular verified users get blue tick
    if (isVerified) {
        return <VerifiedBadge size={16} role="user" />
    }

    // No badge for unverified regular users
    return null
}
