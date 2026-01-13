import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, Save, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminSettings() {
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [newTemplate, setNewTemplate] = useState({
        title: '',
        message: '',
        type: 'info',
        action_label: '',
        action_url: ''
    })

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        setLoading(true)
        const { data } = await supabase.from('prompt_templates').select('*').order('created_at', { ascending: false })
        if (data) setTemplates(data)
        setLoading(false)
    }

    const createTemplate = async () => {
        if (!newTemplate.title) return toast.error('Title required')

        const { error } = await supabase.from('prompt_templates').insert([newTemplate])
        if (error) {
            toast.error('Failed to create')
        } else {
            toast.success('Template Created')
            setNewTemplate({ title: '', message: '', type: 'info', action_label: '', action_url: '' })
            fetchTemplates()
        }
    }

    const deleteTemplate = async (id) => {
        if (!window.confirm('Delete this template?')) return
        await supabase.from('prompt_templates').delete().eq('id', id)
        setTemplates(prev => prev.filter(t => t.id !== id))
        toast.success('Deleted')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>

            <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <FileText size={18} className="text-gray-500" />
                    <h3 className="font-bold text-gray-700">Prompt Templates</h3>
                </div>

                <div className="p-6">
                    {/* Create New */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-8 space-y-4">
                        <h4 className="text-sm font-bold text-gray-700">Create New Template</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Template Title"
                                className="p-2 border rounded text-sm"
                                value={newTemplate.title}
                                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                            />
                            <select
                                className="p-2 border rounded text-sm bg-white"
                                value={newTemplate.type}
                                onChange={e => setNewTemplate({ ...newTemplate, type: e.target.value })}
                            >
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                            <textarea
                                placeholder="Default Message..."
                                className="p-2 border rounded text-sm col-span-2 resize-none"
                                rows={2}
                                value={newTemplate.message}
                                onChange={e => setNewTemplate({ ...newTemplate, message: e.target.value })}
                            />
                            <input
                                placeholder="Default Action URL"
                                className="p-2 border rounded text-sm"
                                value={newTemplate.action_url}
                                onChange={e => setNewTemplate({ ...newTemplate, action_url: e.target.value })}
                            />
                            <input
                                placeholder="Button Label"
                                className="p-2 border rounded text-sm"
                                value={newTemplate.action_label}
                                onChange={e => setNewTemplate({ ...newTemplate, action_label: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={createTemplate}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={16} /> Save Template
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        {templates.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-blue-100 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded textxs font-bold uppercase ${t.type === 'error' ? 'bg-red-100 text-red-700' :
                                                t.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                                                    t.type === 'success' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>{t.type}</span>
                                        <span className="font-bold text-gray-800">{t.title}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{t.message}</p>
                                </div>
                                <button
                                    onClick={() => deleteTemplate(t.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {templates.length === 0 && !loading && <p className="text-center text-gray-500 italic">No templates found.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
