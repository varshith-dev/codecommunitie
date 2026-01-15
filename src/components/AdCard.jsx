import { useEffect } from 'react'
import { ExternalLink, MousePointerClick } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function AdCard({ ad }) {

    const trackClick = async () => {
        try {
            await supabase.rpc('track_ad_click', {
                ad_id: ad.id
            })
        } catch (error) {
            console.error('Error tracking click:', error)
        }
    }

    const trackImpression = async () => {
        try {
            await supabase.rpc('track_ad_impression', {
                ad_id: ad.id
            })
        } catch (error) {
            console.error('Error tracking impression:', error)
        }
    }

    // Simple impression tracking on mount
    // In a real app, use IntersectionObserver
    useEffect(() => {
        trackImpression()
    }, [])

    return (
        <article className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden mb-6 animate-fade-in relative group hover:shadow-md transition-all">
            {/* Green Ad Tag - Requested by User */}
            <div className="absolute top-4 right-4 z-10">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                    Ad
                </span>
            </div>

            {/* Ad Content */}
            <a
                href={ad.target_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                className="block"
            >
                {/* Image */}
                {ad.image_url && (
                    <div className="aspect-video bg-gray-50 relative overflow-hidden">
                        <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-medium flex items-center gap-2">
                                Visit Site <ExternalLink size={14} />
                            </p>
                        </div>
                    </div>
                )}

                {/* Text Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {ad.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {ad.description}
                    </p>

                    {/* Ad Tags */}
                    {ad.tags && ad.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {ad.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md tracking-wider">
                                    #{tag.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* CTA Button */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">Sponsored</span>
                        <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2">
                            {ad.cta_text || 'Learn More'}
                            <MousePointerClick size={16} />
                        </button>
                    </div>
                </div>
            </a>
        </article>
    )
}
