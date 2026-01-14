import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Bell, AlertTriangle, Info, Star, Megaphone } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = {
    bell: Bell,
    warning: AlertTriangle,
    info: Info,
    star: Star,
    alert: Megaphone,
    success: Bell // Default for verified/success can be Bell too or Check
}

// Map types to card styles
const styleMap = {
    info: {
        bg: 'bg-blue-500',
        text: 'text-white',
        btnBg: 'bg-white',
        btnText: 'text-blue-600'
    },
    success: {
        bg: 'bg-[#3eb66d]', // Custom green from screenshot
        text: 'text-white',
        btnBg: 'bg-white',
        btnText: 'text-[#3eb66d]' // Matching text color
    },
    warning: {
        bg: 'bg-orange-500',
        text: 'text-white',
        btnBg: 'bg-white',
        btnText: 'text-orange-600'
    },
    error: {
        bg: 'bg-red-500',
        text: 'text-white',
        btnBg: 'bg-white',
        btnText: 'text-red-600'
    }
}

export default function UserPromptsWidget({ userId }) {
    const [prompts, setPrompts] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!userId) return

        loadPrompts()

        // Subscribe to new prompts
        const channel = supabase
            .channel('user-prompts-widget')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_prompts', // Fixed table name from automated_prompts
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
        // Fetch prompts that are NOT dismissed
        const { data } = await supabase
            .from('user_prompts') // Fixed table name
            .select('*')
            .eq('user_id', userId)
            .eq('is_dismissed', false)
            .order('created_at', { ascending: false })
            .limit(5)

        if (data) {
            setPrompts(data)
        }
    }

    const handleDismiss = async (promptId) => {
        // Optimistic update
        const newPrompts = prompts.filter(p => p.id !== promptId)
        setPrompts(newPrompts)

        // Adjust index if needed
        if (currentIndex >= newPrompts.length && newPrompts.length > 0) {
            setCurrentIndex(newPrompts.length - 1)
        }

        await supabase
            .from('user_prompts')
            .update({ is_dismissed: true })
            .eq('id', promptId)
    }

    if (prompts.length === 0) return null

    const currentPrompt = prompts[currentIndex]
    if (!currentPrompt) return null

    const Icon = iconMap[currentPrompt.icon] || Bell
    const styles = styleMap[currentPrompt.type] || styleMap.info

    return (
        <div className="mb-6">
            <div className={`relative rounded-xl p-5 shadow-lg ${styles.bg} ${styles.text} transition-colors duration-300`}>
                {/* Header Row */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <Icon size={20} className="fill-current text-white/90" />
                        <h3 className="font-bold text-lg leading-tight">{currentPrompt.title}</h3>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium text-white/90">
                            {currentIndex + 1}/{prompts.length}
                        </span>
                    </div>
                    <button
                        onClick={() => handleDismiss(currentPrompt.id)}
                        className="text-white/80 hover:text-white transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <p className="font-medium text-[15px] mb-4 opacity-95 leading-relaxed">
                    {currentPrompt.message}
                </p>

                {/* Action Button */}
                {currentPrompt.action_url && (
                    <Link
                        to={currentPrompt.action_url}
                        className={`inline-block px-5 py-2 rounded-full font-bold text-sm shadow-sm ${styles.btnBg} ${styles.btnText} hover:opacity-90 transition-opacity`}
                    >
                        {currentPrompt.action_label || 'Check it'}
                    </Link>
                )}
            </div>

            {/* Pagination Dots */}
            {prompts.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                    {prompts.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-blue-500 w-4' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
