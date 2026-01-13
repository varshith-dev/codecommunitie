import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff, Save, Loader, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReleaseManager() {
    const [releases, setReleases] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        version: '',
        title: '',
        description: '',
        release_notes: '',
        is_major: false
    })

    useEffect(() => {
        fetchReleases()
    }, [])

    const fetchReleases = async () => {
        try {
            const { data, error } = await supabase
                .from('app_releases')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setReleases(data || [])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load releases')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!form.version || !form.title) {
            toast.error('Version and title are required')
            return
        }

        setSaving(true)
        try {
            if (editing) {
                const { error } = await supabase
                    .from('app_releases')
                    .update({
                        version: form.version,
                        title: form.title,
                        description: form.description,
                        release_notes: form.release_notes,
                        is_major: form.is_major
                    })
                    .eq('id', editing)

                if (error) throw error
                toast.success('Release updated')
            } else {
                const { error } = await supabase
                    .from('app_releases')
                    .insert({
                        version: form.version,
                        title: form.title,
                        description: form.description,
                        release_notes: form.release_notes,
                        is_major: form.is_major,
                        is_published: false
                    })

                if (error) throw error
                toast.success('Release created')
            }

            resetForm()
            fetchReleases()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save release')
        } finally {
            setSaving(false)
        }
    }

    const togglePublish = async (id, currentState) => {
        try {
            const { error } = await supabase
                .from('app_releases')
                .update({
                    is_published: !currentState,
                    published_at: !currentState ? new Date().toISOString() : null
                })
                .eq('id', id)

            if (error) throw error

            setReleases(prev => prev.map(r => r.id === id ? { ...r, is_published: !currentState } : r))
            toast.success(`Release ${!currentState ? 'published' : 'unpublished'}`)
        } catch (error) {
            toast.error('Failed to update release')
        }
    }

    const deleteRelease = async (id) => {
        if (!window.confirm('Delete this release?')) return

        try {
            const { error } = await supabase.from('app_releases').delete().eq('id', id)
            if (error) throw error

            setReleases(prev => prev.filter(r => r.id !== id))
            toast.success('Release deleted')
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const editRelease = (release) => {
        setForm({
            version: release.version,
            title: release.title,
            description: release.description || '',
            release_notes: release.release_notes || '',
            is_major: release.is_major
        })
        setEditing(release.id)
        setShowForm(true)
    }

    const resetForm = () => {
        setForm({ version: '', title: '', description: '', release_notes: '', is_major: false })
        setEditing(null)
        setShowForm(false)
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="h-64 bg-gray-200 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone size={24} />
                        Release Manager
                    </h1>
                    <p className="text-sm text-gray-500">Manage app updates and changelog</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Release
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                            {editing ? 'Edit Release' : 'Create Release'}
                        </h3>
                        <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                            <input
                                type="text"
                                value={form.version}
                                onChange={(e) => setForm(p => ({ ...p, version: e.target.value }))}
                                placeholder="e.g., 1.2.0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g., New Features Update"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Release Notes</label>
                            <textarea
                                value={form.release_notes}
                                onChange={(e) => setForm(p => ({ ...p, release_notes: e.target.value }))}
                                placeholder="- Feature 1&#10;- Bug fix 2&#10;- Improvement 3"
                                rows={5}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_major}
                                    onChange={(e) => setForm(p => ({ ...p, is_major: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">This is a major release</span>
                            </label>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                {editing ? 'Update' : 'Create'} Release
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Releases List */}
            <div className="space-y-4">
                {releases.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <Megaphone size={40} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">No Releases Yet</h3>
                        <p className="text-sm text-gray-500">Create your first release to announce updates</p>
                    </div>
                ) : (
                    releases.map(release => (
                        <div
                            key={release.id}
                            className={`bg-white border rounded-xl p-6 ${release.is_published ? 'border-green-200' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                            v{release.version}
                                        </span>
                                        {release.is_major && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                                MAJOR
                                            </span>
                                        )}
                                        {release.is_published ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                PUBLISHED
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-lg">{release.title}</h3>
                                    {release.description && (
                                        <p className="text-gray-600 text-sm mt-1">{release.description}</p>
                                    )}
                                    {release.release_notes && (
                                        <pre className="mt-3 text-sm text-gray-600 whitespace-pre-wrap font-sans">
                                            {release.release_notes}
                                        </pre>
                                    )}
                                    <p className="text-xs text-gray-400 mt-3">
                                        Created: {new Date(release.created_at).toLocaleDateString()}
                                        {release.published_at && ` • Published: ${new Date(release.published_at).toLocaleDateString()}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => togglePublish(release.id, release.is_published)}
                                        className={`p-2 rounded-lg transition-colors ${release.is_published
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                        title={release.is_published ? 'Unpublish' : 'Publish'}
                                    >
                                        {release.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => editRelease(release)}
                                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteRelease(release.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
