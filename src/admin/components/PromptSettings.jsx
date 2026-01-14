import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Bell, Mail, AlertTriangle, BadgeCheck, Info, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const ICON_OPTIONS = {
    bell: { icon: Bell, color: 'blue' },
    mail: { icon: Mail, color: 'purple' },
    warning: { icon: AlertTriangle, color: 'yellow' },
    verified: { icon: BadgeCheck, color: 'green' },
    info: { icon: Info, color: 'gray' }
}

export default function PromptSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState([])

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('prompt_settings')
                .select('*')
                .order('created_at')

            if (error) throw error
            setSettings(data || [])
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to load prompt settings')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id, field, value) => {
        try {
            const { error } = await supabase
                .from('prompt_settings')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error

            setSettings(settings.map(s =>
                s.id === id ? { ...s, [field]: value } : s
            ))

            toast.success('Setting updated')
        } catch (error) {
            console.error('Error updating:', error)
            toast.error('Failed to update')
        }
    }

    const getDurationLabel = (setting) => {
        if (setting.duration_type === 'until_action') {
            return 'Until action complete'
        }
        if (setting.duration_minutes) {
            const hours = Math.floor(setting.duration_minutes / 60)
            const mins = setting.duration_minutes % 60
            if (hours > 0) {
                return `${hours}h ${mins}m`
            }
            return `${mins} minutes`
        }
        return 'Not set'
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Prompt Settings</h1>
                <p className="text-gray-600 mt-1">Configure automated user prompts and email notifications</p>
            </div>

            <div className="space-y-6">
                {settings.map(setting => {
                    const IconComponent = ICON_OPTIONS[setting.icon_type]?.icon || Bell
                    const iconColor = ICON_OPTIONS[setting.icon_type]?.color || 'blue'

                    return (
                        <div key={setting.id} className="bg-white rounded-xl border border-gray-200 p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 bg-${iconColor}-100 rounded-lg flex items-center justify-center`}>
                                        <IconComponent className={`text-${iconColor}-600`} size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{setting.display_name}</h3>
                                        <p className="text-sm text-gray-500">{setting.template_name}</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={setting.enabled}
                                        onChange={(e) => handleUpdate(setting.id, 'enabled', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Enabled</span>
                                </label>
                            </div>

                            {/* Message Template */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea
                                    value={setting.message_template}
                                    onChange={(e) => handleUpdate(setting.id, 'message_template', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows="2"
                                />
                            </div>

                            {/* Duration Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Duration Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <select
                                        value={setting.duration_type}
                                        onChange={(e) => handleUpdate(setting.id, 'duration_type', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="until_action">Until action complete</option>
                                        <option value="time_based">Time-based</option>
                                    </select>
                                </div>

                                {/* Time Duration (only if time_based) */}
                                {setting.duration_type === 'time_based' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minutes</label>
                                        <select
                                            value={setting.duration_minutes || 5}
                                            onChange={(e) => handleUpdate(setting.id, 'duration_minutes', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="5">5 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="1440">1 day</option>
                                            <option value="10080">1 week</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Icon Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Icon</label>
                                <div className="flex gap-3">
                                    {Object.entries(ICON_OPTIONS).map(([key, { icon: Icon, color }]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleUpdate(setting.id, 'icon_type', key)}
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${setting.icon_type === key
                                                    ? `bg-${color}-100 ring-2 ring-${color}-500`
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                            title={key}
                                        >
                                            <Icon
                                                className={setting.icon_type === key ? `text-${color}-600` : 'text-gray-500'}
                                                size={20}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Email Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Auto-send Email</p>
                                    <p className="text-sm text-gray-600">Automatically send email notifications to matching users</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={setting.auto_send_email}
                                        onChange={(e) => handleUpdate(setting.id, 'auto_send_email', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        {setting.auto_send_email ? 'On' : 'Off'}
                                    </span>
                                </label>
                            </div>

                            {/* Summary */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Summary:</strong> Show prompt {getDurationLabel(setting).toLowerCase()}
                                    {setting.auto_send_email && ' and send email automatically'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
