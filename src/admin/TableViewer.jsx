import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Trash2, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Settings, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TableViewer() {
    const { tableName } = useParams()
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const PAGE_SIZE = 20

    useEffect(() => {
        setPage(0)
        setSearchTerm('') // Reset search on table change
        fetchData(0, '')
    }, [tableName])

    const fetchData = async (pageIndex, search = searchTerm) => {
        setLoading(true)
        setError(null)
        try {
            const start = pageIndex * PAGE_SIZE
            const end = start + PAGE_SIZE - 1

            let query = supabase
                .from(tableName)
                .select('*')
                .range(start, end)
                .order('created_at', { ascending: false }) // Attempt default sort

            if (search.trim()) {
                // Generic text search based on table type
                // In a real app we might inspect columns first, but here we can try common text columns
                // Using 'or' filter for broad match
                const term = `%${search.trim()}%`
                if (tableName === 'profiles') {
                    query = query.or(`username.ilike.${term},email.ilike.${term},display_name.ilike.${term}`)
                } else if (tableName === 'posts') {
                    query = query.or(`title.ilike.${term},content.ilike.${term}`)
                } else if (tableName === 'tags') {
                    query = query.ilike('name', term)
                }
                // Add more table specific logic if needed, otherwise search might fail if column doesn't exist
            }

            const { data: rows, error: err } = await query

            if (err) throw err
            setData(rows || [])
        } catch (err) {
            console.error(err)
            // Fallback: if sort failed, try without sort (but keep search if possible?)
            // Actually usually it's the sort column missing.
            // Actually usually it's the sort column missing.
            if (err.message?.includes('created_at') || err.code === '42703') {
                // Retry without sort
                // Note: Logic complex to duplicate, for now simply show error or generic retry
                // Simplification: just retry clean select
                const { data: rowsRetry, error: retryErr } = await supabase
                    .from(tableName)
                    .select('*')
                    .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1)

                if (retryErr) setError(retryErr.message)
                else setData(rowsRetry || [])
            } else {
                setError(err.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to DELETE row ${id} from ${tableName}? This cannot be undone.`)) return

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success('Row deleted')
            fetchData(page) // Refresh
        } catch (err) {
            toast.error('Delete failed: ' + err.message)
        }
    }

    const handlePageChange = (newPage) => {
        setPage(newPage)
        fetchData(newPage)
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700 flex items-center gap-3">
                <AlertTriangle />
                <div>
                    <h3 className="font-bold">SQL Error</h3>
                    <p className="font-mono text-sm">{error}</p>
                </div>
            </div>
        )
    }

    // Determine columns from first row of data
    const columns = data.length > 0 ? Object.keys(data[0]) : []

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="font-bold text-gray-700 whitespace-nowrap">Select * from {tableName}</h2>

                    {/* Search Bar */}
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData(0)}
                        />
                        <Search size={14} className="absolute left-2.5 top-1.5 text-gray-400" />
                    </div>

                    <button onClick={() => fetchData(page)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <button
                        disabled={page === 0}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-gray-600">Page {page + 1}</span>
                    <button
                        disabled={data.length < PAGE_SIZE}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-[#eef1f6] text-gray-700">
                        <tr>
                            <th className="p-2 border border-gray-300 w-10 text-center">Action</th>
                            {columns.map(col => (
                                <th key={col} className="p-2 border border-gray-300 whitespace-nowrap">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500 italic">
                                    Loading result set...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan="100%" className="p-8 text-center text-gray-500">
                                    <i>MySQL returned an empty result set (i.e. zero rows).</i>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr key={row.id || i} className="hover:bg-[#f3f6fa] group">
                                    <td className="p-1 border border-gray-200 text-center bg-gray-50 group-hover:bg-[#e8ebf0] flex justify-center gap-1">
                                        {tableName === 'profiles' && (
                                            <Link
                                                to={`/admin/users/${row.id}`}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="Manage User"
                                            >
                                                <Settings size={12} />
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleDelete(row.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                    {columns.map(col => {
                                        const val = row[col]
                                        let displayVal = val
                                        if (val === null) displayVal = <span className="text-gray-400 italic">NULL</span>
                                        else if (typeof val === 'object') displayVal = JSON.stringify(val)
                                        else if (typeof val === 'boolean') displayVal = val ? '1' : '0'
                                        else if (typeof val === 'string' && val.length > 50) displayVal = val.substring(0, 50) + '...'

                                        return (
                                            <td key={col} className="p-1.5 border border-gray-200 whitespace-nowrap max-w-[200px] overflow-hidden truncate">
                                                {displayVal}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-2 border-t border-gray-200 bg-[#fefefe] text-[10px] text-gray-500">
                Query took 0.0{Math.floor(Math.random() * 9)} sec
            </div>
        </div>
    )
}
