import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Info, CheckCircle, AlertTriangle, AlertOctagon, ExternalLink } from 'lucide-react'

export default function UserPrompts({ session }) {
    const [prompts, setPrompts] = useState([])

    useEffect(() => {
        if (!session) return

        fetchPrompts()

        // Subscribe to changes
        const channel = supabase
            .channel('public:user_prompts')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'user_prompts', filter: `user_id=eq.${session.user.id}` },
                (payload) => {
                    fetchPrompts()
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [session])

    const fetchPrompts = async () => {
        const { data } = await supabase
            .from('user_prompts')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_dismissed', false)
            .order('created_at', { ascending: false })

        if (data) setPrompts(data)
    }

    const dismissPrompt = async (id) => {
        // Optimistic update
        setPrompts(prev => prev.filter(p => p.id !== id))

        await supabase
            .from('user_prompts')
            .update({ is_dismissed: true })
            .eq('id', id)
    }

    if (prompts.length === 0) return null

    return (
        <div className="fixed top-20 right-6 z-50 w-full max-w-sm flex flex-col gap-3 pointer-events-none">
            {prompts.map(prompt => (
                <div
                    key={prompt.id}
                    className={`
                        pointer-events-auto p-4 rounded-xl shadow-xl border border-white/50 backdrop-blur-md animate-slide-in-right
                        ${prompt.type === 'error' ? 'bg-red-50 text-red-900' :
                            prompt.type === 'warning' ? 'bg-orange-50 text-orange-900' :
                                prompt.type === 'success' ? 'bg-green-50 text-green-900' :
                                    'bg-blue-50 text-blue-900'}
                    `}
                >
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                            {prompt.type === 'error' ? <AlertOctagon size={20} className="text-red-500" /> :
                                prompt.type === 'warning' ? <AlertTriangle size={20} className="text-orange-500" /> :
                                    prompt.type === 'success' ? <CheckCircle size={20} className="text-green-500" /> :
                                        <Info size={20} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm">{prompt.title}</h3>
                            <p className="text-sm mt-1 opacity-90">{prompt.message}</p>

                            {prompt.action_url && (
                                <a
                                    href={prompt.action_url}
                                    target={prompt.action_url.startsWith('http') ? '_blank' : '_self'}
                                    className="inline-flex items-center gap-1 text-xs font-bold mt-3 hover:underline"
                                    rel="noopener noreferrer"
                                >
                                    {prompt.action_label || 'View Details'}
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                        <button
                            onClick={() => dismissPrompt(prompt.id)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
