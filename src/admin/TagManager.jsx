import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Star, Save, Plus, Trash2, Tag, RefreshCw, Pin, GripVertical } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TagManager() {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTag, setNewTag] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editLabel, setEditLabel] = useState('')
    const [isAutoOrder, setIsAutoOrder] = useState(false) // Toggle state

    const dragItem = useRef(null)
    const dragOverItem = useRef(null)

    useEffect(() => {
        fetchTags()
    }, [isAutoOrder]) // Re-fetch when toggle changes

    const fetchTags = async () => {
        setLoading(true)

        let query = supabase.from('tags').select('*')

        if (isAutoOrder) {
            // Auto Order: Trending
            // 1. Pinned tags always on top
            // 2. Then by Post Count (descending)
            // 3. Then by Recent Activity
            query = query
                .order('is_pinned', { ascending: false })
                .order('post_count', { ascending: false, nullsFirst: false })
                .order('last_activity', { ascending: false, nullsFirst: false })
        } else {
            // Manual/Default: featured/pinned first
            // Utilize order_index for manual sorting if available
            query = query
                .order('is_pinned', { ascending: false }) // Pinned always first? Or purely manual? User said "enable me to change the pinned list". 
                // Let's assume Pinned are still special, but maybe they want to reorder WITHIN pinned?
                // For simplicity: Manual Mode = Sort by order_index.
                // But keep Pinned visual distinct.
                // Actually, if we use order_index, we should rely on it fully for the list order.
                // BUT, user app usually treats pinned as special. 
                // Let's try: Sort by order_index asc.
                .order('order_index', { ascending: true })
                .order('created_at', { ascending: false })
        }

        const { data, error } = await query.limit(100)

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
        const { data, error } = await supabase.from('tags').update({ is_featured: newVal }).eq('id', tag.id).select()
        if (error) {
            toast.error('Update failed')
            fetchTags()
        } else {
            toast.success(newVal ? 'Tag Featured!' : 'Tag Un-featured')
        }
    }

    const saveLabel = async (id) => {
        const { data, error } = await supabase.from('tags').update({ feature_label: editLabel || null }).eq('id', id).select()
        if (error) toast.error('Update failed')
        else {
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

        // Get max order_index to append to end
        const maxOrder = tags.length > 0 ? Math.max(...tags.map(t => t.order_index || 0)) : 0

        const { data, error } = await supabase.from('tags').insert([{ name, slug, order_index: maxOrder + 1 }]).select().single()
        if (error) toast.error('Error creating tag')
        else {
            toast.success('Tag created')
            setTags([...tags, data]) // Append
            setNewTag('')
        }
    }

    const togglePinned = async (tag) => {
        const newVal = !tag.is_pinned
        setTags(tags.map(t => t.id === tag.id ? { ...t, is_pinned: newVal } : t))
        const { error } = await supabase.from('tags').update({ is_pinned: newVal }).eq('id', tag.id)
        if (error) { toast.error('Update failed'); fetchTags() }
        else toast.success(newVal ? 'Tag Pinned' : 'Tag Unpinned')
    }

    const deleteTag = async (id) => {
        if (!window.confirm('Delete this tag?')) return
        const { error } = await supabase.from('tags').delete().eq('id', id)
        if (error) toast.error('Delete failed')
        else {
            setTags(tags.filter(t => t.id !== id))
            toast.success('Tag deleted')
        }
    }

    // Drag and Drop Logic
    const handleDragStart = (e, position) => {
        dragItem.current = position
        e.dataTransfer.effectAllowed = 'move'
        // Add styling to row
        e.target.closest('tr').classList.add('opacity-50', 'bg-blue-50')
    }

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position
        e.preventDefault()
    }

    const handleDragOver = (e) => {
        e.preventDefault() // Necessary for drop to fire
    }

    const handleDragEnd = (e) => {
        e.target.closest('tr').classList.remove('opacity-50', 'bg-blue-50')
        dragItem.current = null
        dragOverItem.current = null
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        const copyTags = [...tags]
        const dragItemContent = copyTags[dragItem.current]

        copyTags.splice(dragItem.current, 1)
        copyTags.splice(dragOverItem.current, 0, dragItemContent)

        dragItem.current = null
        dragOverItem.current = null

        // Update local state immediately
        setTags(copyTags)

        // Update order_index for all affected tags
        // We re-assign order_index based on new array index
        const updates = copyTags.map((tag, index) => ({
            id: tag.id,
            order_index: index
        }))

        // Call RPC function to update bulk
        // Or loop update (slower). Let's try RPC first if created, otherwise loop.
        // Since I created the RPC, I'll use it.
        try {
            const { error } = await supabase.rpc('update_tag_order', { tag_updates: updates })
            if (error) {
                console.error('RPC Error:', error)
                // Fallback: update one by one (only changed ones)
                for (const update of updates) {
                    await supabase.from('tags').update({ order_index: update.order_index }).eq('id', update.id)
                }
            }
            toast.success('Order saved')
        } catch (err) {
            console.error('Error saving order', err)
            toast.error('Failed to save order')
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

                <div className="flex items-center gap-4">
                    {/* Auto Order Toggle */}
                    <label className="flex items-center cursor-pointer gap-2 select-none">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={isAutoOrder} onChange={() => setIsAutoOrder(!isAutoOrder)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isAutoOrder ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAutoOrder ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                            Auto Order (Trending)
                        </div>
                    </label>

                    <form onSubmit={createTag} className="flex gap-2">
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
                        <button type="button" onClick={() => fetchTags()} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                            <RefreshCw size={16} />
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                        <tr>
                            {!isAutoOrder && <th className="p-3 w-10"></th>} {/* Drag Handle Header */}
                            <th className="p-3 w-16 text-center">Pinned</th>
                            <th className="p-3 w-16 text-center">Featured</th>
                            <th className="p-3">Tag Name</th>
                            <th className="p-3 text-center">Posts</th>
                            <th className="p-3">Label (Sponsored/Hot)</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-4 text-center">Loading tags...</td></tr>
                        ) : tags.map((tag, index) => (
                            <tr
                                key={tag.id}
                                className={`hover:bg-gray-50 group border-b border-transparent ${dragOverItem.current === index ? 'border-t-2 border-blue-500' : ''} ${tag.is_pinned ? 'bg-purple-50/30' : tag.is_featured ? 'bg-blue-50/30' : ''}`}
                                draggable={!isAutoOrder}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                            >
                                {!isAutoOrder && (
                                    <td className="p-3 text-center cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
                                        <GripVertical size={16} />
                                    </td>
                                )}
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
                                <td className="p-3 text-center text-gray-500 font-mono">
                                    {tag.post_count || 0}
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
