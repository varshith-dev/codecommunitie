import { X, Copy, Twitter, MessageCircle, Share2, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ShareModal({ isOpen, onClose, post }) {
    const [copied, setCopied] = useState(false)

    if (!isOpen || !post) return null

    const postUrl = `${window.location.origin}/post/${post.id}`
    const shareText = `Check out this cool code snippet by ${post.profile?.display_name || 'user'}: ${post.title}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(postUrl)
            setCopied(true)
            toast.success('Link copied!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Failed to copy')
        }
    }

    const shareTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
        window.open(url, '_blank')
    }

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`
        window.open(url, '_blank')
    }

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: shareText,
                    url: postUrl
                })
            } catch (err) {
                // User cancelled or error
            }
        } else {
            toast.error('Sharing not supported on this device')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-900">Share Post</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Copy Link Input */}
                    <div className="relative">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Post Link</label>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 pr-1.5">
                            <input
                                type="text"
                                readOnly
                                value={postUrl}
                                className="bg-transparent border-none focus:ring-0 text-sm text-gray-600 w-full px-3"
                            />
                            <button
                                onClick={handleCopy}
                                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200'}`}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={shareTwitter}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black text-white hover:opacity-90 transition-opacity"
                        >
                            <Twitter size={24} />
                            <span className="text-xs font-medium">X / Twitter</span>
                        </button>
                        <button
                            onClick={shareWhatsApp}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                        >
                            <MessageCircle size={24} />
                            <span className="text-xs font-medium">WhatsApp</span>
                        </button>
                    </div>

                    {navigator.share && (
                        <button
                            onClick={shareNative}
                            className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            <Share2 size={18} />
                            <span>More Options...</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
