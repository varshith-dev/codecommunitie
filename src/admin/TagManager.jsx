import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Star, Save, Plus, Trash2, Tag, RefreshCw, Pin } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TagManager() {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTag, setNewTag] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editLabel, setEditLabel] = useState('')

    useEffect(() => {
        fetchTags()
    }, [])

    const fetchTags = async () => {
        setLoading(true)
        // Fetch all tags, ordering by featured first
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .order('is_featured', { ascending: false })
            .order('post_count', { ascending: false, nullsFirst: false }) // Fallback sort
            .limit(100)

        if (error) {
            toast.error('Failed to load tags')
            console.error(error)
        } else {
            setTags(data || [])
        }
        setLoading(false)
    }

    const toggleFeatured = async (tag) => {
        const newVal = !tag.is_featured

        // Optimistic update
        setTags(tags.map(t => t.id === tag.id ? { ...t, is_featured: newVal } : t))

        const { data, error } = await supabase
            .from('tags')
            .update({ is_featured: newVal })
            .eq('id', tag.id)
            .select()

        if (error || !data || data.length === 0) {
            if (error) console.error(error)
            toast.error('Update failed - Check permissions')
            fetchTags() // Revert
        } else {
            toast.success(newVal ? 'Tag Featured!' : 'Tag Un-featured')
        }
    }

    const saveLabel = async (id) => {
        const { data, error } = await supabase
            .from('tags')
            .update({ feature_label: editLabel || null }) // Send null if empty
            .eq('id', id)
            .select()

        if (error) {
            toast.error('Failed to save label: ' + error.message)
            console.error(error)
        } else if (!data || data.length === 0) {
            toast.error('Update ignored. Check permissions.')
        } else {
            toast.success('Label updated')
            setTags(tags.map(t => t.id === id ? { ...t, feature_label: editLabel } : t))
            setEditingId(null)
        }
    }

    const createTag = async (e) => {
        e.preventDefault()
        if (!newTag.trim()) return

        const slug = newTag.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const name = newTag.trim()

        const { data, error } = await supabase
            .from('tags')
            .insert([{ name, slug }])
            .select()
            .single()

        if (error) {
            toast.error('Error creating tag (might exist)')
        } else {
            toast.success('Tag created')
            setTags([data, ...tags])
            setNewTag('')
        }
    }

    const togglePinned = async (tag) => {
        const newVal = !tag.is_pinned

        // Optimistic update
        setTags(tags.map(t => t.id === tag.id ? { ...t, is_pinned: newVal } : t))

        const { data, error } = await supabase
            .from('tags')
            .update({ is_pinned: newVal })
            .eq('id', tag.id)
            .select()

        if (error || !data || data.length === 0) {
            if (error) console.error(error)
            toast.error('Update failed - Check permissions')
            fetchTags() // Revert
        } else {
            toast.success(newVal ? 'Tag Pinned!' : 'Tag Unpinned')
        }
    }

    const deleteTag = async (id) => {
        if (!window.confirm('Delete this tag? This may break posts using it.')) return

        const { error } = await supabase.from('tags').delete().eq('id', id)
        if (error) {
            toast.error('Delete failed')
        } else {
            setTags(tags.filter(t => t.id !== id))
            toast.success('Tag deleted')
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Tag className="text-blue-600" /> Tag Manager
                    </h2>
                    <p className="text-sm text-gray-500">Manage Trending topics & Sponsored tags</p>
                </div>

                <form onSubmit={createTag} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="New Tag Name..."
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
                        <Plus size={16} /> Add
                    </button>
                    <button type="button" onClick={fetchTags} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                        <RefreshCw size={16} />
                    </button>
                </form>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="p-3 w-16 text-center">Pinned</th>
                            <th className="p-3 w-16 text-center">Featured</th>
                            <th className="p-3">Tag Name</th>
                            <th className="p-3">Label (Sponsored/Hot)</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Loading tags...</td></tr>
                        ) : tags.map(tag => (
                            <tr key={tag.id} className={`hover:bg-gray-50 group ${tag.is_pinned ? 'bg-purple-50/30' : tag.is_featured ? 'bg-blue-50/30' : ''}`}>
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => togglePinned(tag)}
                                        className={`p-1.5 rounded-full transition-colors ${tag.is_pinned ? 'text-purple-600 bg-purple-100' : 'text-gray-300 hover:text-purple-500'}`}
                                        title={tag.is_pinned ? 'Unpin from trending' : 'Pin to trending'}
                                    >
                                        <Pin size={18} fill={tag.is_pinned ? "currentColor" : "none"} />
                                    </button>
                                </td>
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => toggleFeatured(tag)}
                                        className={`p-1.5 rounded-full transition-colors ${tag.is_featured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400'}`}
                                    >
                                        <Star size={18} fill={tag.is_featured ? "currentColor" : "none"} />
                                    </button>
                                </td>
                                <td className="p-3 font-medium text-gray-800">
                                    #{tag.name}
                                </td>
                                <td className="p-3">
                                    {editingId === tag.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="border border-blue-300 rounded px-2 py-1 text-xs w-32"
                                                value={editLabel}
                                                onChange={e => setEditLabel(e.target.value)}
                                                placeholder="e.g. Ad"
                                            />
                                            <button onClick={() => saveLabel(tag.id)} className="text-green-600"><Save size={16} /></button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => { setEditingId(tag.id); setEditLabel(tag.feature_label || ''); }}
                                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded inline-block min-w-[50px] min-h-[24px]"
                                        >
                                            {tag.feature_label ? (
                                                <span className="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                    {tag.feature_label}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs italic">Set label...</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => deleteTag(tag.id)} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
