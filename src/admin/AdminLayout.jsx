import { Outlet, Link, useLocation } from 'react-router-dom'
import { Database, Table as TableIcon, Home, Settings, LogOut, ChevronRight, Users, Activity, ToggleRight, Sparkles, Megaphone, Mail, Gift, TrendingUp } from 'lucide-react'

export default function AdminLayout() {
    const location = useLocation()

    const tables = [
        { name: 'profiles', label: 'public.profiles' },
        { name: 'posts', label: 'public.posts' },
        { name: 'comments', label: 'public.comments' },
        { name: 'likes', label: 'public.likes' },
        { name: 'follows', label: 'public.follows' },
        { name: 'tags', label: 'public.tags' },
        { name: 'post_tags', label: 'public.post_tags' },
    ]

    const SidebarItem = ({ to, icon: Icon, label, isActive }) => (
        <Link
            to={to}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm transition-colors ${isActive
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
        >
            <Icon size={14} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
            <span className="truncate">{label}</span>
        </Link>
    )

    return (
        <div className="h-screen bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <Database size={18} className="text-blue-600" />
                        <span>CodeKrafts DB</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">v.1.0.0 (PostgreSQL)</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                    <SidebarItem
                        to="/admin"
                        icon={Home}
                        label="Server Dashboard"
                        isActive={location.pathname === '/admin'}
                    />
                    <SidebarItem
                        to="/admin/monitor"
                        icon={Activity}
                        label="Live Monitor"
                        isActive={location.pathname === '/admin/monitor'}
                    />
                    <SidebarItem
                        to="/admin/tags"
                        icon={Settings}
                        label="Tag Manager"
                        isActive={location.pathname === '/admin/tags'}
                    />
                    <SidebarItem
                        to="/admin/settings"
                        icon={Settings}
                        label="Admin Settings"
                        isActive={location.pathname === '/admin/settings'}
                    />
                    <SidebarItem
                        to="/admin/verification-requests"
                        icon={Settings}
                        label="Verification"
                        isActive={location.pathname === '/admin/verification-requests'}
                    />
                    <SidebarItem
                        to="/admin/media-review"
                        icon={Settings}
                        label="Media Review"
                        isActive={location.pathname === '/admin/media-review'}
                    />
                    <SidebarItem
                        to="/admin/features"
                        icon={ToggleRight}
                        label="Feature Manager"
                        isActive={location.pathname === '/admin/features'}
                    />
                    <SidebarItem
                        to="/admin/beta"
                        icon={Sparkles}
                        label="Beta Access"
                        isActive={location.pathname === '/admin/beta'}
                    />
                    <SidebarItem
                        to="/admin/releases"
                        icon={Megaphone}
                        label="Releases"
                        isActive={location.pathname === '/admin/releases'}
                    />
                    <SidebarItem
                        to="/admin/email"
                        icon={Mail}
                        label="Email Manager"
                        isActive={location.pathname === '/admin/email'}
                    />
                    <SidebarItem
                        to="/admin/referrals"
                        icon={Gift}
                        label="Referrals"
                        isActive={location.pathname === '/admin/referrals'}
                    />
                    <SidebarItem
                        to="/admin/ads"
                        icon={TrendingUp}
                        label="Ad Manager"
                        isActive={location.pathname === '/admin/ads'}
                    />
                    <SidebarItem
                        to="/admin/users"
                        icon={Users}
                        label="All Users"
                        isActive={location.pathname === '/admin/users'}
                    />
                    <SidebarItem
                        to="/admin/storage"
                        icon={Database}
                        label="Storage Cleanup"
                        isActive={location.pathname === '/admin/storage'}
                    />
                    <SidebarItem
                        to="/admin/table/profiles"
                        icon={TableIcon}
                        label="Raw Profiles Table"
                        isActive={location.pathname.includes('/table/profiles')}
                    />

                    <div className="my-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Tables (public)
                    </div>

                    {tables.map(table => (
                        <SidebarItem
                            key={table.name}
                            to={`/admin/table/${table.name}`}
                            icon={TableIcon}
                            label={table.name}
                            isActive={location.pathname.includes(`/table/${table.name}`)}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-gray-200 bg-gray-50">
                    <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all">
                        <LogOut size={14} />
                        Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar (Breadcrumbs) */}
                <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2 text-sm">
                    <Link to="/admin" className="text-gray-500 hover:text-blue-600">Server: localhost</Link>
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-800">
                        {location.pathname === '/admin' ? 'Dashboard' : `Table: ${location.pathname.split('/').pop()}`}
                    </span>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
