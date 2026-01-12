import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useFollow } from '../hooks/useFollow'

/**
 * Reusable Follow/Unfollow button component
 * @param {object} props
 * @param {string} props.targetUserId - The user ID to follow/unfollow
 * @param {object} props.session - Current user session
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.variant - Variant: 'default', 'outline'
 * @param {string} props.className - Additional classes
 */
export default function FollowButton({
    targetUserId,
    session,
    size = 'md',
    variant = 'default',
    className = ''
}) {
    const { isFollowing, loading, toggleFollow } = useFollow(targetUserId, session)

    if (!session || session.user.id === targetUserId) {
        return null // Don't show button if not logged in or viewing own profile

    }

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base'
    }

    const variantClasses = {
        default: isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
        outline: isFollowing
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300'
            : 'bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-600'
    }

    return (
        <button
            onClick={toggleFollow}
            disabled={loading}
            className={`
        flex items-center gap-2 font-semibold rounded-full 
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${variantClasses[variant]} ${className}
      `}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                </>
            )}
        </button>
    )
}
