import React from 'react'

export default function EmailLogsTable({ logs }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">System Email Logs</h2>
                <span className="text-xs text-gray-500">Last 50 entries</span>
            </div>
            {logs?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <p>No logs found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Recipient</th>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Error</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs?.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {log.recipient_email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]" title={log.subject}>
                                        {log.subject}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{log.template_type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-red-600 max-w-[200px] truncate" title={log.error_message}>
                                        {log.error_message || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
