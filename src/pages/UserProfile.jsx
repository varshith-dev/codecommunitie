import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { User, MapPin, Link as LinkIcon, Calendar, Edit3, Save, Loader2, Camera, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/timeAgo'
import { uploadProfilePicture, uploadBannerImage } from '../services/uploadService'
import Avatar from '../components/Avatar'
import { ProfileSkeleton } from '../components/SkeletonLoader'

export default function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [bannerImageFile, setBannerImageFile] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [bannerImagePreview, setBannerImagePreview] = useState(null)

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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be less than 5MB')
        return
      }
      setProfilePictureFile(file)
      setProfilePicturePreview(URL.createObjectURL(file))
    }
  }

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Banner image must be less than 10MB')
        return
      }
      setBannerImageFile(file)
      setBannerImagePreview(URL.createObjectURL(file))
    }
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
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.display_name || profile?.username || 'Anonymous'}
              </h1>
              {profile?.username && profile?.display_name && (
                <p className="text-gray-500 text-sm">@{profile.username}</p>
              )}
              <p className="text-gray-600 mt-2">{profile?.bio || 'No bio yet.'}</p>

              {/* Stats */}
              <div className="flex gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">{profile?.follower_count || 0}</span>
                  <span className="text-gray-500">Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{profile?.following_count || 0}</span>
                  <span className="text-gray-500">Following</span>
                </div>
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
            </div>
          )}
        </div>
      </div>

      {/* User's Posts Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">Your Posts ({posts.length})</h2>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover-lift transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                  {post.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
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
                <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                  {post.content_url && (
                    post.content_url.endsWith('.mp4') ? (
                      <video src={post.content_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.content_url} alt={post.title} className="w-full h-full object-cover" />
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
          <p className="text-gray-500 mb-4">You haven't posted anything yet.</p>
          <a
            href="/create"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Your First Post
          </a>
        </div>
      )}
    </div>
  )
}