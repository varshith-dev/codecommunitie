import { Shield, ShieldAlert, Award } from 'lucide-react'

export default function RoleBadge({ role }) {
    if (!role || role === 'user') return null

    const config = {
        admin: {
            icon: ShieldAlert,
            text: 'Admin',
            className: 'bg-red-100 text-red-700 border-red-200'
        },
        moderator: {
            icon: Shield,
            text: 'Mod',
            className: 'bg-green-100 text-green-700 border-green-200'
        },
        vip: {
            icon: Award,
            text: 'VIP',
            className: 'bg-purple-100 text-purple-700 border-purple-200'
        }
    }

    const type = config[role.toLowerCase()] || config.admin
    const Icon = type.icon

    return (
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${type.className}`} title={`Role: ${type.text}`}>
            <Icon size={10} />
            {type.text}
        </span>
    )
}
