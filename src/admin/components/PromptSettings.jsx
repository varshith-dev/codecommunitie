import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2, Edit2, Check, X, Bell, Mail, Clock, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PromptSettings() {
    const [automations, setAutomations] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [showModal, setShowModal] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        trigger_type: 'new_user',
        title: '',
        message: '',
        icon: 'bell',
        type: 'info',
        action_label: '',
        action_url: '',
        email_enabled: false,
        email_subject: '',
        email_body: '',
        duration_seconds: 0
    })

    useEffect(() => {
        fetchAutomations()
    }, [])

    const fetchAutomations = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('prompt_automations')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAutomations(data || [])
        } catch (error) {
            console.error('Error fetching automations:', error)
            toast.error('Failed to load rules')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will stop this automation.')) return
        try {
            const { error } = await supabase
                .from('prompt_automations')
                .delete()
                .eq('id', id)

            if (error) throw error
            setAutomations(prev => prev.filter(a => a.id !== id))
            toast.success('Automation deleted')
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { error } = await supabase
                .from('prompt_automations')
                .upsert(formData.id ? formData : { ...formData })
                .select()
                .single()

            if (error) throw error

            toast.success(formData.id ? 'Updated successfully' : 'Created successfully')
            setShowModal(false)
            fetchAutomations()
            resetForm()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save')
        }
    }

    const resetForm = () => {
        setFormData({
            trigger_type: 'new_user',
            title: '',
            message: '',
            icon: 'bell',
            type: 'info',
            action_label: '',
            action_url: '',
            email_enabled: false,
            email_subject: '',
            email_body: '',
            duration_seconds: 0
        })
        setEditingId(null)
    }

    const editAutomation = (item) => {
        setFormData(item)
        setEditingId(item.id)
        setShowModal(true)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
                    <p className="text-gray-500">Manage user onboarding and automated outreach</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true) }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> New Rule
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {automations.map(item => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold uppercase ${item.trigger_type === 'new_user' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.trigger_type.replace('_', ' ')}
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-lg ${item.email_enabled ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {item.email_enabled ? <Mail size={20} /> : <Bell size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">{item.message}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                {item.email_enabled && (
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-green-500" />
                                        <span>Emails also sent</span>
                                    </div>
                                )}
                                {item.action_url && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <span className="font-mono text-xs bg-blue-50 px-1 rounded">{item.action_label}</span>
                                        <span>→ {item.action_url}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => editAutomation(item)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Rule' : 'Create New Rule'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Trigger Section */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} /> Trigger Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trigger Event</label>
                                        <select
                                            value={formData.trigger_type}
                                            onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="new_user">New User Signup</option>
                                            <option value="login">User Login</option>
                                            <option value="create_post">Create Post</option>
                                            <option value="incomplete_profile">Incomplete Profile (On Login)</option>
                                            <option value="manual">Manual (Admin Only)</option>
                                            <option value="time_based">Time Based (Cron)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Timeout (Sec, 0=Forever)</label>
                                        <input
                                            type="number"
                                            value={formData.duration_seconds}
                                            onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Content */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Bell size={16} /> In-App Prompt</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                        <input
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="e.g. Welcome!"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon Type</label>
                                        <select
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="bell">Bell</option>
                                            <option value="star">Star</option>
                                            <option value="gift">Gift</option>
                                            <option value="alert">Alert</option>
                                            <option value="megaphone">Megaphone</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        rows={2}
                                        placeholder="Prompt body text..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Action Button Label</label>
                                        <input
                                            value={formData.action_label}
                                            onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="e.g. Get Started"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Action URL</label>
                                        <input
                                            value={formData.action_url}
                                            onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="/settings or https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email Settings */}
                            <div className="border-t pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><Mail size={16} /> Email Notification</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.email_enabled}
                                            onChange={(e) => setFormData({ ...formData, email_enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {formData.email_enabled && (
                                    <div className="animate-fade-in space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Email Subject</label>
                                            <input
                                                value={formData.email_subject}
                                                onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                                placeholder="Welcome to the platform!"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Email Body (HTML supported)</label>
                                            <textarea
                                                value={formData.email_body}
                                                onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-mono text-sm"
                                                rows={4}
                                                placeholder="<h1>Welcome</h1><p>...</p>"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t font-medium">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                                >
                                    <Save size={18} /> Save Rule
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
