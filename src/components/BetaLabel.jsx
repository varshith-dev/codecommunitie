import { Sparkles } from 'lucide-react'

export default function BetaLabel({ size = 'sm', color = 'blue', className = '' }) {
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm'
    }

    const iconSizes = {
        xs: 8,
        sm: 10,
        md: 14
    }

    const colorClasses = {
        blue: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
        purple: 'bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border-purple-200'
    }

    const iconColors = {
        blue: 'text-blue-600',
        purple: 'text-purple-600'
    }

    return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full border shadow-sm ${colorClasses[color] || colorClasses.blue} ${sizeClasses[size]} ${className}`}>
            <Sparkles size={iconSizes[size]} className={iconColors[color] || iconColors.blue} />
            BETA
        </span>
    )
}
