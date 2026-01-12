import { Loader2 } from 'lucide-react'

/**
 * Reusable loading spinner component
 * @param {object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.text - Optional loading text
 * @param {string} props.className - Additional classes
 * @param {boolean} props.fullScreen - If true, centers in viewport
 */
export default function LoadingSpinner({
    size = 'md',
    text = '',
    className = '',
    fullScreen = false
}) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
            {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                {spinner}
            </div>
        )
    }

    return spinner
}
