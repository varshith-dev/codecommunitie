import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Reusable Avatar component with fallback to initials
 * @param {object} props
 * @param {string} props.src - Avatar image URL
 * @param {string} props.alt - Alt text (usually username)
 * @param {string} props.size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional classes
 * @param {string} props.userId - Optional user ID for linking to profile
 */
export default function Avatar({ src, alt = 'User', size = 'md', className = '', userId = null }) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
        '3xl': 'w-24 h-24 text-3xl'
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    const avatarContent = (
        <div className={`relative ${sizeClasses[size]} ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                        // Fallback if image fails to load
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                    }}
                />
            ) : null}
            <div
                className={`${src ? 'hidden' : 'flex'} w-full h-full rounded-full items-center justify-center font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white border-2 border-white shadow-sm`}
                style={{ display: src ? 'none' : 'flex' }}
            >
                {getInitials(alt)}
            </div>
        </div>
    )

    if (userId) {
        return (
            <Link to={`/user/${userId}`} className="flex-shrink-0">
                {avatarContent}
            </Link>
        )
    }

    return avatarContent
}
