import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { User, MapPin, Link as LinkIcon, Calendar, Edit3, Save, Loader2, Camera, Users, X, ChevronLeft, ChevronRight, Bell, Gift, AlertTriangle, Star, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/timeAgo'
import { uploadProfilePicture, uploadBannerImage } from '../services/uploadService'
import Avatar from '../components/Avatar'
import VerifiedBadge from '../components/VerifiedBadge'
import RoleBadge from '../components/RoleBadge'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import UserListModal from '../components/UserListModal'
import ImageCropperModal from '../components/ImageCropperModal'
import VerificationUpsell from '../components/VerificationUpsell'
import { Link } from 'react-router-dom'

export default function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [activeTab, setActiveTab] = useState('published') // 'published', 'draft', 'scheduled'
  const [showVerificationUpsell, setShowVerificationUpsell] = useState(true)

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'published') return (post.status === 'published' || !post.status) && (!post.scheduled_at || new Date(post.scheduled_at) <= new Date())
    if (activeTab === 'draft') return post.status === 'draft'
    if (activeTab === 'scheduled') return post.scheduled_at && new Date(post.scheduled_at) > new Date()
    return true
  })

  // Form states
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [bannerImageFile, setBannerImageFile] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [bannerImagePreview, setBannerImagePreview] = useState(null)

  // Cropper State
  const [cropperOpen, setCropperOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState(null)
  const [cropFor, setCropFor] = useState(null) // 'profile' or 'banner'

  // Prompt State
  const [prompts, setPrompts] = useState([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)

  // Auto-scroll prompts every 5 seconds
  useEffect(() => {
    if (prompts.length <= 1) return
    const interval = setInterval(() => {
      setCurrentPromptIndex(prev => (prev + 1) % prompts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [prompts.length])

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch Profile Info
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // If no profile exists yet, create a default one
      if (!profileData) {
        profileData = {
          username: user.email.split('@')[0],
          display_name: '',
          bio: '',
          website: '',
          profile_picture_url: null,
          banner_image_url: null,
          follower_count: 0,
          following_count: 0
        }
      }

      setProfile(profileData)
      setUsername(profileData.username || '')
      setDisplayName(profileData.display_name || '')
      setBio(profileData.bio || '')
      setWebsite(profileData.website || '')
      setProfilePicturePreview(profileData.profile_picture_url)
      setBannerImagePreview(profileData.banner_image_url)

      // Fetch User's Prompts (New)
      const { data: promptsData } = await supabase
        .from('user_prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })

      setPrompts(promptsData || [])

      // Check Verification Status
      const { data: verifData } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      const isPending = !!verifData
      const isDismissed = localStorage.getItem('verification_upsell_dismissed') === 'true'

      if (profileData.is_verified || isPending || isDismissed) {
        setShowVerificationUpsell(false)
      } else {
        // Disabled automatic prompt as per user request
        // setShowVerificationUpsell(true)
        setShowVerificationUpsell(false)
      }

      // Fetch User's Posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPosts(postData || [])
    } catch (error) {
      console.error('Error loading profile', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissPrompt = async (id) => {
    // Optimistic update
    setPrompts(prev => prev.filter(p => p.id !== id))
    await supabase
      .from('user_prompts')
      .update({ is_dismissed: true })
      .eq('id', id)
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result)
        setCropFor('profile')
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = null
  }

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setImageToCrop(reader.result)
        setCropFor('banner')
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = null
  }

  const handleCropComplete = (croppedBlob) => {
    if (cropFor === 'profile') {
      const file = new File([croppedBlob], "profile_cropped.jpg", { type: "image/jpeg" })
      setProfilePictureFile(file)
      setProfilePicturePreview(URL.createObjectURL(croppedBlob))
    } else if (cropFor === 'banner') {
      const file = new File([croppedBlob], "banner_cropped.jpg", { type: "image/jpeg" })
      setBannerImageFile(file)
      setBannerImagePreview(URL.createObjectURL(croppedBlob))
    }
    setCropperOpen(false)
    setImageToCrop(null)
    setCropFor(null)
  }

  const handleUpdateProfile = async () => {
    try {
      setUploading(true)
      let profilePictureUrl = profile?.profile_picture_url
      let bannerImageUrl = profile?.banner_image_url

      // Upload profile picture if changed
      if (profilePictureFile) {
        const { url, error } = await uploadProfilePicture(profilePictureFile, user.id)
        if (error) {
          console.error('Profile picture upload error:', error)
          if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            toast.error('Storage bucket "profile-pictures" not found. Please create it in Supabase Storage and make it public.')
          } else {
            toast.error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`)
          }
          setUploading(false)
          return
        }
        profilePictureUrl = url
      }

      // Upload banner image if changed
      if (bannerImageFile) {
        const { url, error } = await uploadBannerImage(bannerImageFile, user.id)
        if (error) {
          console.error('Banner upload error:', error)
          if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            toast.error('Storage bucket "banner-images" not found. Please create it in Supabase Storage and make it public.')
          } else {
            toast.error(`Failed to upload banner: ${error.message || 'Unknown error'}`)
          }
          setUploading(false)
          return
        }
        bannerImageUrl = url
      }

      const updates = {
        id: user.id,
        username,
        display_name: displayName,
        bio,
        website,
        profile_picture_url: profilePictureUrl,
        banner_image_url: bannerImageUrl,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      setProfile(updates)
      setEditing(false)
      setProfilePictureFile(null)
      setBannerImageFile(null)
      toast.success('Profile updated!')
    } catch (error) {
      toast.error('Error updating profile')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <ProfileSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-slide-up">
        {/* Banner Image */}
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {bannerImagePreview && (
            <img
              src={bannerImagePreview}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          {editing && (
            <label className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full cursor-pointer hover:bg-white transition-all shadow-lg">
              <Camera size={20} className="text-gray-700" />
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="px-4 md:px-8 pb-8">
          {/* Avatar and Edit Button */}
          <div className="relative flex justify-between items-end -mt-12 md:-mt-16 mb-6">
            <div className="relative">
              <Avatar
                src={profilePicturePreview}
                alt={displayName || username || 'User'}
                size="3xl"
                className="border-4 border-white shadow-lg"
              />
              {editing && (
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              onClick={() => editing ? handleUpdateProfile() : setEditing(true)}
              disabled={uploading}
              className="px-5 py-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-700 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : editing ? (
                <><Save size={16} /> Save Changes</>
              ) : (
                <><Edit3 size={16} /> Edit Profile</>
              )}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4 max-w-2xl animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Your Name"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Website</label>
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {profile?.display_name || profile?.username || 'Anonymous'}
                {profile?.is_verified && <VerifiedBadge size={20} />}
                <RoleBadge role={profile?.role} />
              </h1>
              {profile?.username && profile?.display_name && (
                <p className="text-gray-500 text-sm">@{profile.username}</p>
              )}
              <p className="text-gray-600 mt-2">{profile?.bio || 'No bio yet.'}</p>

              {/* Stats */}
              <div className="flex gap-6 mt-4 text-sm">
                <button onClick={() => setShowFollowersModal(true)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">{profile?.follower_count || 0}</span>
                  <span className="text-gray-500">Followers</span>
                </button>
                <button onClick={() => setShowFollowingModal(true)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <span className="font-semibold text-gray-900">{profile?.following_count || 0}</span>
                  <span className="text-gray-500">Following</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{posts.length}</span>
                  <span className="text-gray-500">Posts</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <LinkIcon size={16} /> <span>Website</span>
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={16} /> <span>Joined {formatDate(user?.created_at)}</span>
                </div>
              </div>

              {!profile?.is_verified && showVerificationUpsell && (
                <VerificationUpsell onClose={() => {
                  localStorage.setItem('verification_upsell_dismissed', 'true')
                  setShowVerificationUpsell(false)
                }} />
              )}

              {/* Admin Prompts - Flashcard Carousel */}
              {prompts.length > 0 && (
                <div className="mt-4 relative">
                  {/* Current Prompt */}
                  {(() => {
                    const prompt = prompts[currentPromptIndex]
                    if (!prompt) return null
                    return (
                      <div className={`rounded-xl p-6 flex items-start justify-between relative overflow-hidden animate-fade-in backdrop-blur-md border border-white/20 shadow-lg ${prompt.type === 'error' ? 'bg-red-600/85 text-white' :
                        prompt.type === 'warning' ? 'bg-amber-500/85 text-white' :
                          prompt.type === 'success' ? 'bg-green-600/85 text-white' :
                            'bg-blue-600/85 text-white'
                        }`}>
                        {/* Glass Shine Effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                        <div className="flex-1 z-10 pl-6">
                          <div className="flex items-center gap-2 mb-1">
                            {/* Prompt Icon */}
                            {(() => {
                              const ICON_MAP = { bell: Bell, gift: Gift, alert: AlertTriangle, star: Star, megaphone: Megaphone }
                              const IconComponent = ICON_MAP[prompt.icon] || Bell
                              return <IconComponent size={22} className="text-white drop-shadow-sm" />
                            })()}
                            <h3 className="font-bold text-lg drop-shadow-sm">
                              {prompt.title}
                            </h3>
                            {prompts.length > 1 && (
                              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                                {currentPromptIndex + 1} / {prompts.length}
                              </span>
                            )}
                          </div>
                          <p className="text-white/95 text-sm mb-3 max-w-lg font-medium drop-shadow-sm">{prompt.message}</p>
                          {prompt.action_url && (
                            <a
                              href={prompt.action_url}
                              className="inline-block bg-white text-gray-900 px-5 py-2 rounded-full text-xs font-bold hover:bg-white/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                              {prompt.action_label || 'Check it'}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            dismissPrompt(prompt.id)
                            // Adjust index if we dismissed the last one
                            if (currentPromptIndex >= prompts.length - 1 && currentPromptIndex > 0) {
                              setCurrentPromptIndex(currentPromptIndex - 1)
                            }
                          }}
                          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all z-20"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )
                  })()}

                  {/* Dot Indicators */}
                  {prompts.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {prompts.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPromptIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === currentPromptIndex ? 'bg-blue-500 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User's Posts Grid */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-gray-900">Your Posts</h2>

        {/* Status Tabs */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'published' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Published
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'draft' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Drafts
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'scheduled' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Scheduled
          </button>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filteredPosts.map(post => (
            <Link to={`/post/${post.id}`} key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover-lift transition-all block group relative">
              {/* Draft/Schedule Badge */}
              {post.status !== 'published' && (
                <div className={`absolute top-4 right-4 z-10 px-2 py-1 rounded-md text-xs font-bold uppercase ${post.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-purple-100 text-purple-600'}`}>
                  {post.status === 'draft' ? 'DRAFT' : 'SCHEDULED'}
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                  {post.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">
                  {post.scheduled_at ? `Due: ${formatDate(post.scheduled_at)}` : formatDate(post.created_at)}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>

              {post.type === 'code' ? (
                <div className="bg-slate-900 rounded-lg p-3 overflow-hidden h-24 relative">
                  <pre className="text-xs text-slate-300 font-mono line-clamp-4">
                    {post.code_snippet}
                  </pre>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                </div>
              ) : (
                <>
                  <div className="h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
                    {post.content_url && (
                      post.content_url.endsWith('.mp4') ? (
                        <video src={post.content_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.content_url} alt={post.title} className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  {post.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{post.description}</p>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
          <p className="text-gray-500 mb-4">No {activeTab} posts found.</p>
          <a
            href="/create"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Post
          </a>
        </div>
      )}

      {showFollowersModal && (
        <UserListModal
          userId={user?.id}
          type="followers"
          title="Followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {showFollowingModal && (
        <UserListModal
          userId={user?.id}
          type="following"
          title="Following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}

      {cropperOpen && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          aspect={cropFor === 'profile' ? 1 : 3}
          cropShape={cropFor === 'profile' ? 'round' : 'rect'}
          onCancel={() => {
            setCropperOpen(false)
            setImageToCrop(null)
            setCropFor(null)
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}