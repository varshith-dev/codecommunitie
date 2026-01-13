import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Megaphone, Sparkles, ArrowLeft, Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Changelog() {
    const [releases, setReleases] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReleases()
    }, [])

    const fetchReleases = async () => {
        try {
            const { data, error } = await supabase
                .from('app_releases')
                .select('*')
                .eq('is_published', true)
                .order('published_at', { ascending: false })

            if (error) throw error
            setReleases(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-64 bg-gray-200 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone size={24} />
                        What's New
                    </h1>
                    <p className="text-sm text-gray-500">Latest updates and improvements</p>
                </div>
            </div>

            {releases.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No updates yet</h3>
                    <p className="text-sm text-gray-500">Check back soon for announcements!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {releases.map((release, index) => (
                        <div
                            key={release.id}
                            className={`bg-white rounded-xl border p-6 ${index === 0 ? 'border-blue-200 shadow-md' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                    v{release.version}
                                </span>
                                {release.is_major && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                        MAJOR
                                    </span>
                                )}
                                {index === 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                        <Sparkles size={10} />
                                        LATEST
                                    </span>
                                )}
                            </div>
                            <h2 className="font-bold text-lg text-gray-900 mb-2">{release.title}</h2>
                            {release.description && (
                                <p className="text-gray-600 text-sm mb-3">{release.description}</p>
                            )}
                            {release.release_notes && (
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                    {release.release_notes}
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-4">
                                Released {new Date(release.published_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
