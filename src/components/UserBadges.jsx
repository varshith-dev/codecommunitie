import VerifiedBadge from './VerifiedBadge'


export default function UserBadges({ user }) {
    if (!user) return null

    const role = user.role ? user.role.toLowerCase() : 'user'
    const isAdmin = role === 'admin' || role === 'moderator'
    const isAdvertiser = role === 'advertiser'
    const isVerified = user.is_verified

    // Priority: Admin/Mod (Gold) > Advertiser (Green) > Verified (Blue)
    if (isAdmin) {
        return <VerifiedBadge role={role} />
    }

    if (isAdvertiser) {
        return <VerifiedBadge role="advertiser" />
    }

    if (isVerified) {
        return <VerifiedBadge role="user" />
    }

    // For other roles (like VIP), we might still want to show a tag if they are NOT verified?
    // But per user request, we are simplifying. If they have a special role that isn't admin/advertiser, 
    // we fallback to RoleBadge ONLY if they are not verified/special badge holders? 
    // actually, the user said "dont show admin tag". 
    // Let's stick to the requested colors.

    return null
}
