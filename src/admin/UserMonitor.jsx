import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Ban, CheckCircle, AlertTriangle } from 'lucide-react'

export default function UserMonitor() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        setUsers(data || [])
        setLoading(false)
    }

    const filteredUsers = users.filter(u =>
        (u.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (u.display_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="border border-[#003b00] p-4 bg-[#001100] flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#00ff41]">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH_DB::USERNAME"
                        className="bg-transparent border-b border-[#003b00] focus:border-[#00ff41] outline-none text-[#00ff41] placeholder-[#005500] w-64 font-mono"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-xs text-[#008f11]">
                    RECORDS_FOUND: {filteredUsers.length}
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="border border-[#003b00] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#002200] text-[#00ff41] uppercase border-b border-[#003b00]">
                        <tr>
                            <th className="p-3">ID_REF</th>
                            <th className="p-3">USER_HANDLE</th>
                            <th className="p-3">DISPLAY_NAME</th>
                            <th className="p-3">JOIN_DATE</th>
                            <th className="p-3">STATUS</th>
                            <th className="p-3 text-right">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#003b00]">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-[#ffb000] animate-pulse">
                                    INITIALIZING_DATA_STREAM...
                                </td>
                            </tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-[#001100] transition-colors group">
                                    <td className="p-3 text-[#005500] font-mono">{user.id.slice(0, 8)}...</td>
                                    <td className="p-3 text-[#00ff41]">{user.username || 'NULL'}</td>
                                    <td className="p-3 text-[#008f11]">{user.display_name}</td>
                                    <td className="p-3 text-[#005500]">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className="flex items-center gap-1 text-[#00ff41]">
                                            <CheckCircle size={12} /> ACTIVE
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button className="text-[#ff0055] hover:bg-[#2a000a] px-2 py-1 border border-transparent hover:border-[#ff0055] transition-all opacity-0 group-hover:opacity-100 uppercase text-[10px] flex items-center gap-1 ml-auto">
                                            <Ban size={12} /> SUSPEND
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-[#ff0055]">
                                    ERR: NO_RECORDS_MATCH_QUERY
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
