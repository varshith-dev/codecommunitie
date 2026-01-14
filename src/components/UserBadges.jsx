import VerifiedBadge from './VerifiedBadge'
import RoleBadge from './RoleBadge'

export default function UserBadges({ user }) {
    if (!user) return null

    return (
        <div className="inline-flex items-center gap-1 align-middle">
            {user.is_verified && <VerifiedBadge />}
            {user.role && <RoleBadge role={user.role} />}
        </div>
    )
}
