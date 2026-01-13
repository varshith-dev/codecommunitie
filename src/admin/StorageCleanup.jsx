import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Trash2, RefreshCw, Database, HardDrive, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StorageCleanup() {
    const [loading, setLoading] = useState(false)
    const [scanResult, setScanResult] = useState(null) // { unusedAvatars: [], unusedPostImages: [] }

    const scanStorage = async () => {
        setLoading(true)
        setScanResult(null)
        try {
            // 1. Fetch ALL Database References
            const { data: profiles, error: pError } = await supabase.from('profiles').select('profile_picture_url')
            const { data: posts, error: poError } = await supabase.from('posts').select('content_url')

            if (pError || poError) throw new Error('Failed to fetch DB records')

            // Extract file paths/names from URLs
            // Supabase URL format: .../storage/v1/object/public/bucket_name/filename
            const extractName = (url) => url ? url.split('/').pop() : null

            const dbAvatarNames = new Set(profiles.map(p => extractName(p.profile_picture_url)).filter(Boolean))
            const dbPostImageNames = new Set(posts.map(p => extractName(p.content_url)).filter(Boolean))

            // 2. Fetch ALL Storage Files
            // Note: list() has a limit (default 100). We should technically loop, but for now max 1000.
            const { data: avatarFiles, error: aError } = await supabase.storage.from('avatars').list('', { limit: 1000 })
            const { data: postFiles, error: piError } = await supabase.storage.from('post-images').list('', { limit: 1000 })

            if (aError || piError) throw new Error('Failed to list storage files')

            // 3. Compare
            const unusedAvatars = avatarFiles.filter(f => f.name !== '.emptyFolderPlaceholder' && !dbAvatarNames.has(f.name))
            const unusedPostImages = postFiles.filter(f => f.name !== '.emptyFolderPlaceholder' && !dbPostImageNames.has(f.name))

            setScanResult({
                unusedAvatars,
                unusedPostImages,
                stats: {
                    totalAvatars: avatarFiles.length,
                    totalPostImages: postFiles.length,
                    dbAvatars: dbAvatarNames.size,
                    dbPostImages: dbPostImageNames.size
                }
            })
            toast.success('Scan complete')

        } catch (error) {
            console.error('Scan failed:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteFile = async (bucket, filename) => {
        if (!window.confirm(`Delete ${filename}? This cannot be undone.`)) return

        try {
            const { error } = await supabase.storage.from(bucket).remove([filename])
            if (error) throw error

            toast.success('File deleted')
            // Update Review List locally
            setScanResult(prev => ({
                ...prev,
                [bucket === 'avatars' ? 'unusedAvatars' : 'unusedPostImages']: prev[bucket === 'avatars' ? 'unusedAvatars' : 'unusedPostImages'].filter(f => f.name !== filename)
            }))
        } catch (error) {
            toast.error('Failed to delete file')
        }
    }

    const deleteBatch = async (bucket, files) => {
        if (!window.confirm(`Delete ${files.length} files from ${bucket}?`)) return

        try {
            const fileNames = files.map(f => f.name)
            const { error } = await supabase.storage.from(bucket).remove(fileNames)
            if (error) throw error

            toast.success(`Deleted ${files.length} files`)
            setScanResult(prev => ({
                ...prev,
                [bucket === 'avatars' ? 'unusedAvatars' : 'unusedPostImages']: []
            }))
        } catch (error) {
            toast.error('Batch delete failed')
        }
    }

    const FileList = ({ bucket, files }) => (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    {bucket === 'avatars' ? <UserIcon /> : <ImageIcon />}
                    {bucket === 'avatars' ? 'Orphaned Avatars' : 'Orphaned Post Images'}
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{files.length}</span>
                </h3>
                {files.length > 0 && (
                    <button
                        onClick={() => deleteBatch(bucket, files)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                    >
                        Delete All
                    </button>
                )}
            </div>
            {files.length === 0 ? (
                <div className="p-8 text-center text-green-600 bg-green-50/50">
                    <CheckCircle className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No unused files found!</p>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {files.map(f => (
                        <div key={f.name} className="relative group border rounded-lg overflow-hidden bg-gray-100 aspect-square">
                            <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${f.name}`}
                                className="w-full h-full object-cover"
                                alt="Orphan"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a
                                    href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${f.name}`}
                                    target="_blank" rel="noreferrer"
                                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"
                                >
                                    <HardDrive size={16} />
                                </a>
                                <button
                                    onClick={() => deleteFile(bucket, f.name)}
                                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate text-center">
                                {(f.metadata?.size / 1024).toFixed(1)} KB
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Media Storage Cleanup</h1>
                    <p className="text-gray-500 text-sm">Find and remove files that are not linked to any database record.</p>
                </div>
                <button
                    onClick={scanStorage}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                    Scan Storage
                </button>
            </div>

            {scanResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-scale-in">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold">Total Storage Objects</div>
                        <div className="text-2xl font-black text-gray-800">
                            {scanResult.stats.totalAvatars + scanResult.stats.totalPostImages}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold">Unused Objects</div>
                        <div className="text-2xl font-black text-red-600">
                            {scanResult.unusedAvatars.length + scanResult.unusedPostImages.length}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold">DB References</div>
                        <div className="text-2xl font-black text-blue-600">
                            {scanResult.stats.dbAvatars + scanResult.stats.dbPostImages}
                        </div>
                    </div>
                </div>
            )}

            {scanResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <FileList bucket="avatars" files={scanResult.unusedAvatars} />
                    <FileList bucket="post-images" files={scanResult.unusedPostImages} />
                </div>
            )}

            {!scanResult && !loading && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                    <Database className="mx-auto mb-4 opacity-50" size={48} />
                    <h3 className="text-lg font-medium text-gray-600">Ready to Scan</h3>
                    <p className="max-w-md mx-auto mt-2 text-sm">
                        Click "Scan Storage" to verify the integrity of your storage buckets against the database records.
                    </p>
                </div>
            )}
        </div>
    )
}
