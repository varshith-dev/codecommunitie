import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Bell, AlertTriangle, Info, Star, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = {
    bell: Bell,
    warning: AlertTriangle,
    info: Info,
    star: Star,
    alert: Megaphone
}

const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
}

const buttonColorMap = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white'
}

export default function UserPromptsWidget({ userId }) {
    const [prompts, setPrompts] = useState([])
    const [dismissed, setDismissed] = useState([])

    useEffect(() => {
        if (!userId) return

        loadPrompts()

        // Subscribe to new prompts
        const channel = supabase
            .channel('user-prompts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'automated_prompts',
                    filter: `user_id=eq.${userId}`
                },
                () => loadPrompts()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const loadPrompts = async () => {
        const { data } = await supabase
            .from('automated_prompts')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['sent', 'viewed'])
            .order('created_at', { ascending: false })
            .limit(5)

        if (data) {
            // Mark as viewed
            const unviewedIds = data.filter(p => p.status === 'sent').map(p => p.id)
            if (unviewedIds.length > 0) {
                await supabase
                    .from('automated_prompts')
                    .update({ status: 'viewed', viewed_at: new Date().toISOString() })
                    .in('id', unviewedIds)
            }

            setPrompts(data.filter(p => !dismissed.includes(p.id)))
        }
    }

    const handleDismiss = async (promptId) => {
        setDismissed(prev => [...prev, promptId])

        await supabase
            .from('automated_prompts')
            .update({
                status: 'dismissed',
                dismissed_at: new Date().toISOString()
            })
            .eq('id', promptId)
    }

    const handleClick = async (prompt) => {
        await supabase
            .from('automated_prompts')
            .update({
                status: 'clicked',
                clicked_at: new Date().toISOString()
            })
            .eq('id', prompt.id)

        setDismissed(prev => [...prev, prompt.id])
    }

    const activePrompts = prompts.filter(p => !dismissed.includes(p.id))

    if (activePrompts.length === 0) return null

    return (
        <div className="space-y-3 mb-6">
            {activePrompts.map(prompt => {
                const Icon = iconMap[prompt.icon] || Bell
                const colorClass = colorMap[prompt.btn_color] || colorMap.blue
                const buttonClass = buttonColorMap[prompt.btn_color] || buttonColorMap.blue

                return (
                    <div
                        key={prompt.id}
                        className={`${colorClass} border rounded-xl p-4 shadow-sm animate-slide-down`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <Icon size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">{prompt.title}</h4>
                                <p className="text-sm opacity-90">{prompt.message}</p>
                                {prompt.action_url && prompt.btn_label && (
                                    <Link
                                        to={prompt.action_url}
                                        onClick={() => handleClick(prompt)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-3 ${buttonClass} transition-colors`}
                                    >
                                        {prompt.btn_label}
                                    </Link>
                                )}
                            </div>
                            <button
                                onClick={() => handleDismiss(prompt.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
