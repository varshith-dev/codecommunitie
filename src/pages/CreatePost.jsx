import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Code, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadPostMedia } from '../services/uploadService'

export default function CreatePost() {
  const [type, setType] = useState('code') // 'code' or 'meme'
  const [title, setTitle] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('JavaScript')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error("You must be logged in")

      let finalUrl = contentUrl

      // 1. Upload File if selected (Meme/Video)
      if (type === 'meme' && file) {
        const { url, error } = await uploadPostMedia(file, user.id)
        if (error) throw new Error('Failed to upload media')
        finalUrl = url
      }

      // 2. Insert into Database
      const { error: dbError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          title,
          type,
          content_url: finalUrl,
          code_snippet: type === 'code' ? codeSnippet : null,
          code_language: type === 'code' ? codeLanguage : null
        }])

      if (dbError) throw dbError

      toast.success('Post created successfully!')
      navigate('/')

    } catch (error) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Post</h1>

        {/* Type Selector Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setType('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${type === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Code size={18} /> Code Snippet
          </button>
          <button
            onClick={() => setType('meme')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${type === 'meme' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <ImageIcon size={18} /> Meme / Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="What is this about?"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Conditional Inputs */}
          {type === 'code' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                >
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>HTML</option>
                  <option>CSS</option>
                  <option>React</option>
                  <option>SQL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <textarea
                  placeholder="// Paste your code here..."
                  className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
              <input
                type="file"
                accept="image/*,video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <ImageIcon size={32} className="text-gray-300" />
                <span className="text-sm font-medium text-blue-600">
                  {file ? file.name : "Click to upload image or video"}
                </span>
                <span className="text-xs text-gray-400">Max 20MB</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            {uploading ? 'Posting...' : 'Share Post'}
          </button>
        </form>
      </div>
    </div>
  )
}