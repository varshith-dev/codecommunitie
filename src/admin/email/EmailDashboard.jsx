import React, { useState, useEffect } from 'react'
import { LayoutDashboard, PenSquare, History, Users } from 'lucide-react'
import EmailComposer from './EmailComposer'
import EmailHistory from './EmailHistory'
import EmailAudience from './EmailAudience'
import { EmailService } from '../../services/EmailService'

export default function EmailDashboard() {
    const [activeTab, setActiveTab] = useState('compose')
    const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })
    const [selectedUsers, setSelectedUsers] = useState([]) // Array of user objects

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const data = await EmailService.getStats()
            setStats(data)
        } catch (e) {
            console.error(e)
        }
    }

    const handleAudienceSelection = (users) => {
        setSelectedUsers(users)
        setActiveTab('compose')
    }

    const StatCard = ({ label, value, color }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</div>
            </div>
            <div className={`w-2 h-full rounded-full ${color}`}></div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
            {/* Note: adjusted height to account for main navbar if present, or h-screen if standalone. Assuming nested in AdminLayout. */}
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-20">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="text-blue-600" />
                    Marketing Hub
                </h1>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'compose' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <PenSquare size={16} className="inline mr-2" /> Composer
                    </button>
                    <button
                        onClick={() => setActiveTab('audience')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'audience' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} className="inline mr-2" /> Audience
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); loadStats() }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History size={16} className="inline mr-2" /> History
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-auto">
                {/* Only show stats on History or Audience overview? Maybe just keep them at top or move to specific tabs. Keeping for now but checking layout. */}
                {/* Actually, let's keep stats only for History or a general Overview. For Composer/Audience, specific tools are better. */}

                {activeTab === 'history' && (
                    <div className="p-6 pb-0">
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <StatCard label="Total Emails" value={stats.total} color="bg-blue-500" />
                            <StatCard label="Successfully Sent" value={stats.sent} color="bg-green-500" />
                            <StatCard label="Failed" value={stats.failed} color="bg-red-500" />
                        </div>
                    </div>
                )}

                <div className="h-full p-6">
                    {activeTab === 'compose' ? (
                        <EmailComposer preSelectedUsers={selectedUsers} onClearSelection={() => setSelectedUsers([])} />
                    ) : activeTab === 'audience' ? (
                        <EmailAudience onSelectUsers={handleAudienceSelection} />
                    ) : (
                        <EmailHistory />
                    )}
                </div>
            </div>
        </div>
    )
}
