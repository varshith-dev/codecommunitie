import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Heart, MessageCircle, Trash2, Code2, Share2, Edit2, TrendingUp, Clock, Users, AlertTriangle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import CommentSection from '../components/CommentSection'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import { PostSkeleton } from '../components/SkeletonLoader'
import { timeAgo } from '../utils/timeAgo'
import { Link } from 'react-router-dom'
import BookmarkButton from '../components/BookmarkButton'
import UserBadges from '../components/UserBadges'
import VideoPlayer from '../components/VideoPlayer'

import EditPostModal from '../components/EditPostModal'
import ShareModal from '../components/ShareModal'

// Helper to inject a visual console into the iframe
const injectConsole = (html) => {
  const consoleScript = `
    <div id="custom-console" style="position:fixed;bottom:0;left:0;right:0;height:150px;background:rgba(30,30,30,0.95);color:#fff;font-family:monospace;font-size:11px;overflow-y:auto;border-top:1px solid #444;display:none;flex-direction:column;padding:4px;z-index:9999;">
        <div style="position:sticky;top:0;background:#1e1e1e;border-bottom:1px solid #333;padding:2px 4px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;">
             <span>CONSOLE</span>
             <button onclick="document.getElementById('custom-console').style.display='none'" style="background:none;border:none;color:#888;cursor:pointer;">&times;</button>
        </div>
        <div id="console-output"></div>
    </div>
    <script>
      (function() {
        // 1. Shim LocalStorage to prevent sandbox crashes
        try {
            var x = window.localStorage;
        } catch(e) {
            console.warn("LocalStorage access denied in sandbox. Using memory polyfill.");
            var storage = {};
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: function(k) { return storage[k] || null; },
                    setItem: function(k, v) { storage[k] = String(v); },
                    removeItem: function(k) { delete storage[k]; },
                    clear: function() { storage = {}; },
                    key: function(i) { return Object.keys(storage)[i]; },
                    get length() { return Object.keys(storage).length; }
                },
                writable: false
            });
        }

        // 2. Setup Console UI
        var consoleEl = document.getElementById('custom-console');
        var output = document.getElementById('console-output');
        
        function showConsole() { consoleEl.style.display = 'flex'; }
        
        function log(type, args) {
           showConsole();
           var div = document.createElement('div');
           div.style.padding = '2px 4px';
           div.style.borderBottom = '1px solid #333';
           
           if(type === 'error') { div.style.color = '#ff6b6b'; div.style.background = 'rgba(255,0,0,0.1)'; }
           if(type === 'warn') { div.style.color = '#feca57'; }
           
           var text = args.map(function(arg) {
               try {
                   return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
               } catch(e) { return '[Circular/Object]'; }
           }).join(' ');
           
           div.textContent = '> ' + text;
           output.appendChild(div);
           consoleEl.scrollTop = consoleEl.scrollHeight;
        }

        var oldLog = console.log;
        var oldWarn = console.warn;
        var oldError = console.error;

        console.log = function() { oldLog.apply(console, arguments); log('log', Array.from(arguments)); };
        console.warn = function() { oldWarn.apply(console, arguments); log('warn', Array.from(arguments)); };
        console.error = function() { oldError.apply(console, arguments); log('error', Array.from(arguments)); };
        
        window.onerror = function(msg, url, line) {
            log('error', ["Line " + line + ": " + msg]);
        };
      })();
    </script>
  `;

  // Inject into head if possible, otherwise prepend
  if (html.includes('<head>')) {
    return html.replace('<head>', '<head>' + consoleScript);
  } else if (html.includes('<body>')) {
    return html.replace('<body>', '<body>' + consoleScript);
  } else {
    return consoleScript + html;
  }
}

export default function Feed({ session }) {

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [likeCounts, setLikeCounts] = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [userLikes, setUserLikes] = useState(new Set())
  const [connectionError, setConnectionError] = useState(false)
  const [activeTab, setActiveTab] = useState('latest') // 'latest', 'trending', 'following'
  const [editingPost, setEditingPost] = useState(null)
  const [sharingPost, setSharingPost] = useState(null)
  const [previewStates, setPreviewStates] = useState({}) // Map of postId -> boolean
  const [expandedCode, setExpandedCode] = useState({}) // Map of postId -> boolean in state

  const togglePreview = (postId) => {
    setPreviewStates(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const toggleExpanded = (postId) => {
    setExpandedCode(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code copied!')
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const [isAdmin, setIsAdmin] = useState(false)

  const fetchAdminStatus = async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (data?.role === 'admin') {
      setIsAdmin(true)
    }
  }

  useEffect(() => {
    fetchPosts()
    if (session) {
      fetchUserLikes()
      fetchAdminStatus()
    }
  }, [session, activeTab])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setConnectionError(false)

      // Fetch posts based on tab
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

      if (activeTab === 'following' && session) {
        // First get followed user IDs
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', session.user.id)

        const followingIds = follows?.map(f => f.following_id) || []
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds)
        } else {
          // If following no one, return empty
          setPosts([])
          setLoading(false)
          return
        }
      }

      const { data: postsData, error: postsError } = await query

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        if (postsError.message?.includes('relation') || postsError.message?.includes('does not exist')) {
          setConnectionError(true)
        }
        throw postsError
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))]

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, profile_picture_url, is_verified, role')
        .in('id', userIds)

      // Fetch tags for these posts
      const { data: tagsData } = await supabase
        .from('post_tags')
        .select('post_id, tags (id, name, slug)')
        .in('post_id', postsData.map(p => p.id))

      // Map tags to posts
      const tagsMap = {}
      tagsData?.forEach(item => {
        if (!tagsMap[item.post_id]) tagsMap[item.post_id] = []
        if (item.tags) tagsMap[item.post_id].push(item.tags)
      })

      // Create a map of profiles by user_id
      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Combine posts with profiles and tags
      let postsWithData = postsData.map(post => ({
        ...post,
        profile: profilesMap[post.user_id] || {
          id: post.user_id,
          username: 'Anonymous',
          display_name: 'Anonymous User',
          profile_picture_url: null
        },
        tags: tagsMap[post.id] || []
      }))

      // If trending, sort client-side (mocking trending logic since we fetch in batch)
      if (activeTab === 'trending') {
        // We'll sort after fetching counts effectively, but for now simple sort by view_count if available or keep default
        // In a real app we'd do this on DB. Let's rely on default order for now and maybe specific query later.
      }

      setPosts(postsWithData)

      // Fetch counts for all posts
      if (postsWithData.length > 0) {
        await fetchAllCounts(postsWithData.map(p => p.id))
      }
    } catch (error) {
      if (!connectionError) {
        toast.error('Error loading feed')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Sort posts whenever activeTab or counts change
  const getSortedPosts = () => {
    if (activeTab === 'trending') {
      return [...posts].sort((a, b) => {
        const scoreA = (likeCounts[a.id] || 0) + (commentCounts[a.id] || 0) * 2
        const scoreB = (likeCounts[b.id] || 0) + (commentCounts[b.id] || 0) * 2
        return scoreB - scoreA
      })
    }
    return posts
  }

  const displayedPosts = getSortedPosts()

  const fetchAllCounts = async (postIds) => {
    try {
      // Fetch like counts
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      const likes = {}
      likesData?.forEach(like => {
        likes[like.post_id] = (likes[like.post_id] || 0) + 1
      })
      setLikeCounts(likes)

      // Fetch comment counts
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)

      const comments = {}
      commentsData?.forEach(comment => {
        comments[comment.post_id] = (comments[comment.post_id] || 0) + 1
      })
      setCommentCounts(comments)
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const fetchUserLikes = async () => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', session.user.id)

      setUserLikes(new Set(data?.map(like => like.post_id) || []))
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error

      setPosts(posts.filter(post => post.id !== postId))
      toast.success('Post deleted successfully')
    } catch (error) {
      toast.error('Error deleting post')
    }
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    setEditingPost(null)
  }

  const handleLike = async (postId) => {
    if (!session) {
      toast.error('Please login to like posts')
      return
    }

    const isLiked = userLikes.has(postId)
    const userId = session.user.id

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId)

        setUserLikes(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }))
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: userId, post_id: postId }])

        setUserLikes(prev => new Set([...prev, postId]))
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    }
  }

  const handleShare = async (post) => {
    try {
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to copy link')
    }
  }

  const toggleComments = (postId) => {
    setActiveCommentId(activeCommentId === postId ? null : postId)
  }


  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center animate-scale-in">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Database Not Set Up</h2>
          <p className="text-red-700 mb-6">
            It looks like your Supabase database hasn't been configured yet. Please follow these steps:
          </p>
          <div className="bg-white rounded-xl p-6 text-left space-y-4 border border-red-200">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">1. Create Supabase Project</h3>
              <p className="text-sm text-gray-600">Sign up at <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">2. Run Database Schema</h3>
              <p className="text-sm text-gray-600">Open SQL Editor in Supabase and run the contents of <code className="bg-gray-100 px-2 py-1 rounded">database_complete.sql</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">3. Create Storage Buckets</h3>
              <p className="text-sm text-gray-600">Create public buckets: <code className="bg-gray-100 px-1 rounded text-xs">profile-pictures</code>, <code className="bg-gray-100 px-1 rounded text-xs">banner-images</code>, <code className="bg-gray-100 px-1 rounded text-xs">meme-uploads</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">4. Configure Environment</h3>
              <p className="text-sm text-gray-600">Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> and add your Supabase credentials</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">See README.md for detailed instructions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto pb-20">
      {/* Feed Toggle - Smooth & Satisfying Design */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-1.5 mb-6 shadow-sm flex items-center justify-between max-w-2xl mx-auto">
        {[
          { id: 'latest', label: 'Latest', icon: Clock },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'following', label: 'Following', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 relative overflow-hidden
              ${activeTab === tab.id
                ? 'text-blue-600 bg-blue-50 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <tab.icon size={18} className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} strokeWidth={2.5} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handlePostUpdate}
        />
      )}

      <ShareModal
        isOpen={!!sharingPost}
        onClose={() => setSharingPost(null)}
        post={sharingPost}
      />

      {connectionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-center">
          <p className="font-semibold">Connection Error</p>
          <p className="text-sm">Please ensure the database is set up correctly.</p>
          <div className="mt-4 text-left bg-white p-4 rounded-lg border border-red-100 font-mono text-xs overflow-x-auto">
            <h3 className="font-bold text-gray-900 mb-2">Troubleshooting Steps:</h3>
            <div className="mb-2">
              <h3 className="font-bold text-gray-900 mb-2">1. Run Completions</h3>
              <p className="text-sm text-gray-600">Open SQL Editor in Supabase and run the contents of <code className="bg-gray-100 px-2 py-1 rounded">database_complete.sql</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">3. Create Storage Buckets</h3>
              <p className="text-sm text-gray-600">Create public buckets: <code className="bg-gray-100 px-1 rounded text-xs">profile-pictures</code>, <code className="bg-gray-100 px-1 rounded text-xs">banner-images</code>, <code className="bg-gray-100 px-1 rounded text-xs">meme-uploads</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">4. Configure Environment</h3>
              <p className="text-sm text-gray-600">Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> and add your Supabase credentials</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">See README.md for detailed instructions</p>
        </div>
      )}

      {displayedPosts.map(post => (
        <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-slide-up">
          {/* Post Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/user/@${post.profile?.username || post.user_id}`}>
                <Avatar src={post.profile?.profile_picture_url} alt={post.profile?.display_name || post.profile?.username} />
              </Link>
              <div>
                <Link to={`/user/@${post.profile?.username || post.user_id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                  {post.profile?.display_name || post.profile?.username || 'Anonymous'}
                  <UserBadges user={post.profile} />
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>@{post.profile?.username || 'user'}</span>
                  <span>•</span>
                  <span>{timeAgo(post.created_at)}</span>
                  {post.edited_at && <span className="text-gray-400 italic">(edited)</span>}
                  {post.visibility === 'followers' && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px]">Followers</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${post.type === 'code' ? 'bg-blue-50 text-blue-600' :
                post.type === 'blog' ? 'bg-purple-50 text-purple-600' :
                  'bg-pink-50 text-pink-600'
                }`}>
                {post.type.toUpperCase()}
              </span>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
                  <button
                    onClick={async () => {
                      const label = window.prompt('Set Admin Label (e.g., Trending, Featured, Staff Pick)', post.admin_label || '')
                      if (label === null) return // Cancelled

                      const { error } = await supabase
                        .from('posts')
                        .update({ admin_label: label || null })
                        .eq('id', post.id)

                      if (error) {
                        toast.error('Failed to update label')
                      } else {
                        toast.success('Label updated')
                        setPosts(posts.map(p => p.id === post.id ? { ...p, admin_label: label || null } : p))
                      }
                    }}
                    className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-full hover:bg-purple-50"
                    title="Set Admin Label"
                  >
                    <Sparkles size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Admin Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Edit/Delete Buttons (Owner) */}
              {session && session.user.id === post.user_id && !isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="text-gray-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Title & Tags */}
          <div className="px-4 pb-2">
            {/* Admin Label Display */}
            {post.admin_label && (
              <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded shadow-sm">
                <Sparkles size={10} />
                {post.admin_label.toUpperCase()}
              </div>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {post.tags.map(tag => (
                  <span key={tag.id} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Content Rating Warning */}
            {post.content_rating === 'risk' && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
                <span className="text-xs font-medium text-yellow-800">⚠️ Watch at your own risk</span>
              </div>
            )}

            {post.title && (
              <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
            )}
          </div>

          {/* Post Content */}
          <div className="px-4 pb-2">
            {post.type === 'meme' && post.content_url && (
              <>
                <div className="rounded-xl overflow-hidden bg-black/5 border border-gray-100">
                  {/* Robust Video Detection */}
                  {(post.content_url.match(/\.(mp4|webm|ogg|mov|mkv|avi|qt)$/i) || post.content_url.includes('video')) ? (
                    <VideoPlayer
                      src={post.content_url}
                      title={post.title}
                    />
                  ) : (
                    <img src={post.content_url} alt={post.title} className="w-full max-h-[600px] object-contain" loading="lazy" />
                  )}
                </div>
                {post.description && (
                  <p className="mt-3 text-gray-700 text-sm leading-relaxed">{post.description}</p>
                )}
              </>
            )}

            {post.type === 'code' && post.code_snippet && (
              <div className="rounded-xl overflow-hidden border border-gray-800 shadow-md">
                <div className="bg-[#1e1e1e] px-4 py-2 flex justify-between items-center border-b border-gray-700">
                  <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                    <Code2 size={12} />
                    {post.code_language || 'PLAINTEXT'}
                  </span>

                  <div className="flex items-center gap-3">
                    {(post.code_language?.toLowerCase() === 'html' || post.code_language?.toLowerCase() === 'xml') && (
                      <button
                        onClick={() => togglePreview(post.id)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${previewStates[post.id]
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
                          }`}
                      >
                        {previewStates[post.id] ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyCode(post.code_snippet)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy Code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    </button>
                  </div>
                </div>

                {previewStates[post.id] ? (
                  <div className="bg-white border-b border-gray-200">
                    <iframe
                      title={`Preview ${post.id}`}
                      srcDoc={injectConsole(post.code_snippet)}
                      className="w-full h-96 border-0 block"
                      sandbox="allow-scripts allow-modals"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <div className={`transition-all duration-300 ${expandedCode[post.id] ? 'max-h-none' : 'max-h-60 overflow-hidden'}`}>
                      <SyntaxHighlighter
                        language={(post.code_language || 'javascript').toLowerCase()}
                        style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.9rem' }}
                        showLineNumbers={true}
                        wrapLongLines={true}
                      >
                        {post.code_snippet}
                      </SyntaxHighlighter>
                    </div>

                    {post.code_snippet.length > 300 && (
                      <div className={`absolute bottom-0 left-0 right-0 p-2 flex justify-center ${!expandedCode[post.id] ? 'bg-gradient-to-t from-[#1e1e1e] to-transparent pt-12' : 'bg-[#1e1e1e]/50'}`}>
                        <button
                          onClick={() => toggleExpanded(post.id)}
                          className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg backdrop-blur-sm transition-all flex items-center gap-1"
                        >
                          {expandedCode[post.id] ? (
                            <>Show Less <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg></>
                          ) : (
                            <>Show Full Code <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {post.type === 'blog' && post.description && (
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: post.description
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">$1</a>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${userLikes.has(post.id)
                ? 'text-pink-600 bg-pink-50 hover:bg-pink-100'
                : 'text-gray-500 hover:text-pink-600 hover:bg-gray-100'
                }`}
            >
              <Heart size={20} className={userLikes.has(post.id) ? 'fill-current' : ''} />
              <span className="text-sm font-medium">{likeCounts[post.id] || 0}</span>
            </button>

            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-all"
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">{commentCounts[post.id] || 0}</span>
            </button>

            <BookmarkButton postId={post.id} session={session} size={20} />

            <button
              onClick={() => setSharingPost(post)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-all ml-auto"
            >
              <Share2 size={20} />
            </button>
          </div>

          {activeCommentId === post.id && (
            <CommentSection
              postId={post.id}
              session={session}
              onCommentAdded={() => {
                setCommentCounts(prev => ({
                  ...prev,
                  [post.id]: (prev[post.id] || 0) + 1
                }))
              }}
            />
          )}

        </article>
      ))}

      {
        posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 animate-fade-in">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code2 className="text-blue-500" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
            <p className="text-gray-500 mt-2">Be the first to share something amazing!</p>
            {session && (
              <Link
                to="/create"
                className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Post
              </Link>
            )}
          </div>
        )
      }
    </div>
  )
}
