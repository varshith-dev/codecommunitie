import { Link } from 'react-router-dom'
import { Database, Settings, ArrowRight } from 'lucide-react'

export default function Dashboard() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
                <Database className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Panel</h1>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                    Manage your application data, users, and content directly from this dashboard.
                    Select a module from the sidebar to get started.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <Link to="/admin/table/profiles" className="group flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-800">Manage Users</h3>
                            <p className="text-xs text-gray-500">View & Edit Profiles</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                    </Link>

                    <Link to="/admin/tags" className="group flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-800">Tag Manager</h3>
                            <p className="text-xs text-gray-500">Trending & Featured</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-400 group-hover:text-blue-600" />
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                Connected to Supabase PostgreSQL • v1.0.0
            </div>
        </div>
    )
}
