import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Settings, ToggleLeft, ToggleRight, Plus, Trash2, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import BetaLabel from '../components/BetaLabel'

export default function FeatureManager() {
    const [features, setFeatures] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newFeature, setNewFeature] = useState({ id: '', name: '', description: '', is_beta: false })

    useEffect(() => {
        fetchFeatures()
    }, [])

    const fetchFeatures = async () => {
        try {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error
            setFeatures(data || [])
        } catch (error) {
            console.error('Error fetching features:', error)
            toast.error('Failed to load features')
        } finally {
            setLoading(false)
        }
    }

    const toggleFeature = async (id, currentState) => {
        try {
            const { error } = await supabase
                .from('feature_flags')
                .update({ is_enabled: !currentState, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error

            setFeatures(prev => prev.map(f => f.id === id ? { ...f, is_enabled: !currentState } : f))
            toast.success(`Feature ${!currentState ? 'enabled' : 'disabled'}`)
        } catch (error) {
            toast.error('Failed to toggle feature')
        }
    }

    const toggleBeta = async (id, currentState) => {
        try {
            const { error } = await supabase
                .from('feature_flags')
                .update({ is_beta: !currentState, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error

            setFeatures(prev => prev.map(f => f.id === id ? { ...f, is_beta: !currentState } : f))
            toast.success(`Beta status updated`)
        } catch (error) {
            toast.error('Failed to update beta status')
        }
    }

    const addFeature = async () => {
        if (!newFeature.id || !newFeature.name) {
            toast.error('ID and Name are required')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('feature_flags')
                .insert({
                    id: newFeature.id.toLowerCase().replace(/\s+/g, '_'),
                    name: newFeature.name,
                    description: newFeature.description,
                    is_beta: newFeature.is_beta,
                    is_enabled: false
                })

            if (error) throw error

            toast.success('Feature added')
            setNewFeature({ id: '', name: '', description: '', is_beta: false })
            setShowAddForm(false)
            fetchFeatures()
        } catch (error) {
            console.error(error)
            toast.error('Failed to add feature')
        } finally {
            setSaving(false)
        }
    }

    const deleteFeature = async (id) => {
        if (!window.confirm('Delete this feature?')) return

        try {
            const { error } = await supabase
                .from('feature_flags')
                .delete()
                .eq('id', id)

            if (error) throw error

            setFeatures(prev => prev.filter(f => f.id !== id))
            toast.success('Feature deleted')
        } catch (error) {
            toast.error('Failed to delete feature')
        }
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
                        <Settings size={24} />
                        Feature Manager
                    </h1>
                    <p className="text-sm text-gray-500">Toggle features and manage beta access</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Feature
                </button>
            </div>

            {/* Add Feature Form */}
            {showAddForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Add New Feature</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Feature ID</label>
                            <input
                                type="text"
                                value={newFeature.id}
                                onChange={(e) => setNewFeature(prev => ({ ...prev, id: e.target.value }))}
                                placeholder="e.g., dark_mode"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={newFeature.name}
                                onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Dark Mode"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={newFeature.description}
                                onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What does this feature do?"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newFeature.is_beta}
                                    onChange={(e) => setNewFeature(prev => ({ ...prev, is_beta: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">This is a beta feature</span>
                            </label>
                            <button
                                onClick={addFeature}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Feature
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Features List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Feature</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Beta</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {features.map((feature) => (
                            <tr key={feature.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900">{feature.name}</div>
                                        {feature.is_beta && <BetaLabel size="xs" />}
                                    </div>
                                    <div className="text-sm text-gray-500">{feature.description}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-1">ID: {feature.id}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleFeature(feature.id, feature.is_enabled)}
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${feature.is_enabled
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {feature.is_enabled ? (
                                            <><ToggleRight size={16} /> Enabled</>
                                        ) : (
                                            <><ToggleLeft size={16} /> Disabled</>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleBeta(feature.id, feature.is_beta)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${feature.is_beta
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {feature.is_beta ? 'Beta' : 'Stable'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => deleteFeature(feature.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {features.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No features configured yet
                    </div>
                )}
            </div>
        </div>
    )
}
