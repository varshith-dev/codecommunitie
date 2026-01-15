import { useState, useEffect } from 'react'
import { ExternalLink, MousePointerClick, Flag } from 'lucide-react'
import { supabase } from '../supabaseClient'
import ReportAdModal from './ReportAdModal'

export default function AdCard({ ad }) {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    const trackClick = async () => {
        try {
            await supabase.rpc('track_ad_click_secure', {
                target_ad_id: ad.id
            })
        } catch (error) {
            console.error('Error tracking click:', error)
        }
    }

    const trackImpression = async () => {
        try {
            await supabase.rpc('track_ad_impression_secure', {
                target_ad_id: ad.id
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
        <>
            <article className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden mb-6 animate-fade-in relative group hover:shadow-md transition-all">
                {/* Green Ad Tag - Requested by User */}
                {/* Green Ad Tag - Requested by User */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        Ad
                    </span>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            setIsReportModalOpen(true)
                        }}
                        className="bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 p-1 rounded-full shadow-sm transition-colors"
                        title="Report Ad"
                    >
                        <Flag size={14} />
                    </button>
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

            <ReportAdModal
                ad={ad}
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </>
    )
}
