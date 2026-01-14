import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Monitor, Smartphone, Tablet, MapPin, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const deviceIconMap = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet
}

export default function UserDevicesPanel({ userId }) {
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            loadDevices()
        }
    }, [userId])

    const loadDevices = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_devices')
                .select('*')
                .eq('user_id', userId)
                .order('last_login', { ascending: false })

            if (error) throw error
            setDevices(data || [])
        } catch (error) {
            console.error('Error loading devices:', error)
            toast.error('Failed to load device history')
        } finally {
            setLoading(false)
        }
    }

    const toggleSuspicious = async (deviceId, isSuspicious) => {
        try {
            const { error } = await supabase
                .from('user_devices')
                .update({ is_suspicious: !isSuspicious })
                .eq('id', deviceId)

            if (error) throw error

            setDevices(devices.map(d =>
                d.id === deviceId ? { ...d, is_suspicious: !isSuspicious } : d
            ))

            toast.success(isSuspicious ? 'Unmarked as suspicious' : 'Marked as suspicious')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to update device')
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Monitor size={20} className="text-blue-600" />
                    Device History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    All login devices for this user
                </p>
            </div>

            <div className="divide-y divide-gray-100">
                {devices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No device history available
                    </div>
                ) : (
                    devices.map(device => {
                        const DeviceIcon = deviceIconMap[device.device_type] || Monitor

                        return (
                            <div
                                key={device.id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${device.is_suspicious ? 'bg-red-50' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${device.is_suspicious ? 'bg-red-100' : 'bg-gray-100'
                                            }`}>
                                            <DeviceIcon size={24} className={
                                                device.is_suspicious ? 'text-red-600' : 'text-gray-600'
                                            } />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {device.browser} on {device.os}
                                                </h4>
                                                {device.is_suspicious && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        Suspicious
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                                {device.ip_address && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        {device.ip_address}
                                                    </span>
                                                )}

                                                {device.location_city && (
                                                    <span>
                                                        {device.location_city}, {device.location_country}
                                                    </span>
                                                )}

                                                <span className="flex items-center gap-1">
                                                    <TrendingUp size={14} />
                                                    {device.login_count} {device.login_count === 1 ? 'login' : 'logins'}
                                                </span>

                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    Last: {formatDistanceToNow(new Date(device.last_login), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {device.user_agent && (
                                                <div className="mt-2 text-xs text-gray-400 font-mono truncate max-w-2xl">
                                                    {device.user_agent}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleSuspicious(device.id, device.is_suspicious)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${device.is_suspicious
                                                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {device.is_suspicious ? 'Unmark' : 'Mark Suspicious'}
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
