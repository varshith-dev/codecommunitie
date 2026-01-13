import React, { useEffect, useState } from 'react'
import { EmailService } from '../../services/EmailService'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function EmailHistory() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const data = await EmailService.getHistory()
            setLogs(data || [])
        } catch (error) {
            console.error('Failed to load history', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Loading logs...</div>

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Recipient</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Template</th>
                            <th className="px-4 py-3">Trigger</th>
                            <th className="px-4 py-3">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                                    No emails sent yet.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {log.status === 'sent' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                                <CheckCircle2 size={12} /> Sent
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                                                <XCircle size={12} /> Failed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{log.recipient_email}</td>
                                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{log.subject}</td>
                                    <td className="px-4 py-3 text-gray-500">{log.template_type}</td>
                                    <td className="px-4 py-3 text-gray-500 capitalize">{log.triggered_by}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
