import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Code, Send, Loader2, Save, Globe, Users, Lock, Calendar, Clock, X, Newspaper } from 'lucide-react'
import TagInput from '../components/TagInput'
import toast from 'react-hot-toast'
import { uploadPostMedia } from '../services/uploadService'
import CustomDatePicker from '../components/CustomDatePicker'

export default function CreatePost() {
  const [type, setType] = useState('code') // 'code' or 'meme'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('JavaScript')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [tags, setTags] = useState([])
  const [visibility, setVisibility] = useState('public')
  const [scheduledDate, setScheduledDate] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [userProfile, setUserProfile] = useState(null) // For permission checks

  const navigate = useNavigate()

  useEffect(() => {
    checkUserPermissions()
  }, [])

  const checkUserPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('is_verified, role').eq('id', user.id).single()
      setUserProfile(data)
    }
  }


  const canPostBlog = userProfile?.is_verified || ['admin', 'moderator'].includes(userProfile?.role)

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault()
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in")

      // Use state or fetch if missing
      let profile = userProfile
      if (!profile) {
        const { data } = await supabase.from('profiles').select('is_verified, role').eq('id', user.id).single()
        profile = data
      }

      // 1. Validation: Empty Fields
      if (!title?.trim()) throw new Error("Title is required")
      if (type === 'code' && !codeSnippet?.trim()) throw new Error("Code snippet is required")
      if (type === 'meme' && !file && !isDraft) throw new Error("Please upload an image or video")
      if (type === 'blog' && !description?.trim()) throw new Error("Blog content is required")

      // Permission Check for Blog
      if (type === 'blog' && !canPostBlog) {
        throw new Error("Only verified users and moderators can post blogs.")
      }

      // 2. Validation: Links
      // Rules:
      // - Code posts: Everyone can include links
      // - Blog/Meme posts: Only verified users can include links
      if (type !== 'code') {
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b)/i
        const textToCheck = `${title} ${description || ''}`

        // Allow links for: verified users, advertisers, moderators, admins
        const isPrivileged = profile?.is_verified || ['admin', 'moderator', 'advertiser'].includes(profile?.role)

        if (!isPrivileged && urlRegex.test(textToCheck)) {
          throw new Error("Only verified users can include links in blog posts.")
        }
      }

      let finalUrl = contentUrl

      // 3. Upload File if selected (Meme/Video)
      if (type === 'meme' && file) {
        const { url, error } = await uploadPostMedia(file, user.id)
        if (error) throw new Error('Failed to upload media')
        finalUrl = url
      }

      // Determine Status & Schedule
      let status = isDraft ? 'draft' : 'published'
      let scheduledAt = null

      if (!isDraft && scheduledDate) {
        status = 'published' // It's "published" but hidden by RLS until date
        scheduledAt = scheduledDate.toISOString()
      }

      // 4. Insert into Database
      const { data: newPost, error: dbError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          title,
          type,
          description: (type === 'meme' || type === 'blog') ? description : null,
          content_url: finalUrl,
          code_snippet: type === 'code' ? codeSnippet : null,
          code_language: type === 'code' ? codeLanguage : null,
          status: status,
          visibility: visibility,
          scheduled_at: scheduledAt
        }])
        .select()
        .single()

      if (dbError) throw dbError

      // 5. Add tags if any
      if (tags.length > 0 && newPost) {
        for (const tagName of tags) {
          const slug = tagName.toLowerCase().replace(/\s+/g, '-')

          // Get or create tag
          let { data: tag } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', slug)
            .single()

          if (!tag) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName, slug })
              .select('id')
              .single()
            tag = newTag
          }

          // Link tag to post
          if (tag) {
            await supabase
              .from('post_tags')
              .insert({ post_id: newPost.id, tag_id: tag.id })
          }
        }
      }

      if (isDraft) {
        toast.success('Draft saved successfully!')
      } else if (scheduledAt) {
        toast.success(`Post scheduled for ${scheduledDate.toLocaleString()}`)
      } else {
        toast.success('Post published successfully!')
      }

      navigate('/')

    } catch (error) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 transition-all">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Post</h1>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
            {scheduledDate ? 'Scheduled' : 'New Post'}
          </div>
        </div>

        {/* Type Selector Tabs */}
        <div className="flex p-1.5 bg-gray-100/80 rounded-2xl mb-8">
          <button
            onClick={() => setType('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${type === 'code' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Code size={20} /> Code Snippet
          </button>
          <button
            onClick={() => setType('meme')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${type === 'meme' ? 'bg-white text-pink-600 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <ImageIcon size={20} /> Meme / Video
          </button>
          <button
            onClick={() => canPostBlog && setType('blog')}
            disabled={!canPostBlog}
            title={!canPostBlog ? "Only verified users can post blogs" : "Share custom elements and links"}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${type === 'blog' ? 'bg-white text-purple-600 shadow-md transform scale-[1.02]' : !canPostBlog ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            <Newspaper size={20} /> Blog
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              placeholder="Give your post a catchy title..."
              className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-lg placeholder:font-normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Conditional Inputs */}
          {type === 'code' ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white appearance-none font-medium"
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                  >
                    <option>JavaScript</option>
                    <option>Python</option>
                    <option>TypeScript</option>
                    <option>HTML</option>
                    <option>CSS</option>
                    <option>React</option>
                    <option>SQL</option>
                    <option>Rust</option>
                    <option>Go</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Code size={16} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Code</label>
                <textarea
                  placeholder="// Paste your awesome code here..."
                  className="w-full h-64 px-5 py-4 rounded-xl border border-gray-200 font-mono text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-[#1e1e1e] text-blue-100 placeholder:text-gray-600"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : type === 'meme' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-blue-50/50 hover:border-blue-300 transition-all text-center cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div className="flex flex-col items-center gap-3 text-gray-500 transition-transform group-hover:scale-105">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    {file ? <ImageIcon size={32} /> : <ImageIcon size={32} />}
                  </div>
                  <span className="text-base font-semibold text-gray-900">
                    {file ? file.name : "Drop image or video here"}
                  </span>
                  <span className="text-sm text-gray-500">or click to browse (Max 20MB)</span>
                </div>
              </div>

              {/* Description for Meme */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Caption <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="What's happening in this?"
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-purple-700 text-sm flex gap-2">
                <Newspaper size={20} className="flex-shrink-0" />
                <div>
                  <strong className="block mb-1">Blog Post</strong>
                  <p>Share your thoughts, tutorials, or updates. HTML content and verified links are allowed.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                <textarea
                  placeholder="Write your article here..."
                  className="w-full h-80 px-5 py-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all text-gray-800 text-base leading-relaxed resize-y placeholder:text-gray-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Visibility</label>
              <div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${visibility === 'public'
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                    }`}
                >
                  <Globe size={16} /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('followers')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${visibility === 'followers'
                    ? 'bg-white text-purple-600 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                    }`}
                >
                  <Users size={16} /> Followers
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${visibility === 'private'
                    ? 'bg-white text-amber-600 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                    }`}
                >
                  <Lock size={16} /> Private
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Schedule</label>
              {!showSchedule ? (
                <button
                  type="button"
                  onClick={() => setShowSchedule(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600 transition-all font-semibold"
                >
                  <Calendar size={18} /> Schedule for later
                </button>
              ) : (
                <div className="relative">
                  <DatePicker
                    selected={scheduledDate}
                    onChange={(date) => setScheduledDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-300 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900 font-medium"
                    placeholderText="Select date & time"
                    minDate={new Date()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScheduledDate(null)
                      setShowSchedule(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex gap-4 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              Save Draft
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" /> : (scheduledDate ? <Clock size={18} /> : <Send size={18} />)}
              {uploading ? 'Processing...' : (scheduledDate ? 'Schedule Post' : 'Post Now')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}