import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Loader2, Code2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // Redirects back to your app
        }
      })
      if (error) throw error
      setSent(true)
      toast.success('Magic link sent!')
    } catch (error) {
      toast.error(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        
        {/* Card Container */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          
          {/* Logo Animation */}
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <Code2 size={32} className="text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CodeKrafts</h1>
          <p className="text-gray-500 mb-8">The social network for developers.</p>

          {sent ? (
            // Success State
            <div className="bg-green-50 p-6 rounded-xl border border-green-100 animate-in fade-in zoom-in">
              <div className="text-green-600 font-semibold text-lg mb-2">Check your email!</div>
              <p className="text-gray-600 text-sm">
                We sent a magic link to <span className="font-bold">{email}</span>.
                <br/>Click it to log in.
              </p>
              <button 
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    Send Magic Link <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              By joining, you agree to share nice code and funny memes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}