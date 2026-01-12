import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditPostModal({ post, onClose, onPostUpdated }) {
    const [title, setTitle] = useState(post.title || '')
    const [codeSnippet, setCodeSnippet] = useState(post.code_snippet || '')
    const [codeLanguage, setCodeLanguage] = useState(post.code_language || '')
    const [description, setDescription] = useState(post.description || '')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Title is required')
            return
        }

        if (post.type === 'code' && !codeSnippet.trim()) {
            toast.error('Code snippet is required')
            return
        }

        setLoading(true)

        try {
            const updates = {
                title: title.trim(),
                edited_at: new Date().toISOString()
            }

            if (post.type === 'code') {
                updates.code_snippet = codeSnippet.trim()
                updates.code_language = codeLanguage || 'plaintext'
            } else {
                updates.description = description.trim()
            }

            const { error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', post.id)

            if (error) throw error

            toast.success('Post updated successfully')
            onPostUpdated({ ...post, ...updates })
            onClose()
        } catch (error) {
            console.error('Error updating post:', error)
            toast.error('Failed to update post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Edit Post</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="Enter post title"
                            maxLength={200}
                        />
                    </div>

                    {/* Code Fields */}
                    {post.type === 'code' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Code Language
                                </label>
                                <select
                                    value={codeLanguage}
                                    onChange={(e) => setCodeLanguage(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                >
                                    <option value="">Select language</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="csharp">C#</option>
                                    <option value="go">Go</option>
                                    <option value="rust">Rust</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="html">HTML</option>
                                    <option value="css">CSS</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Code Snippet <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={codeSnippet}
                                    onChange={(e) => setCodeSnippet(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono text-sm resize-none"
                                    rows={12}
                                    placeholder="Paste your code here..."
                                />
                            </div>
                        </>
                    )}

                    {/* Description for Memes */}
                    {post.type === 'meme' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-gray-400">(Optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                rows={4}
                                placeholder="Add a description or caption..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
