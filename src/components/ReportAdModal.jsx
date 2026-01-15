import { useState } from 'react'
import { X, AlertTriangle, Send } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function ReportAdModal({ ad, isOpen, onClose }) {
    const [reason, setReason] = useState('inappropriate')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('You must be logged in to report an advertisement')
                return
            }

            const { error } = await supabase
                .from('ad_reports')
                .insert({
                    ad_id: ad.id,
                    reporter_id: user.id,
                    reason: reason,
                    description: description,
                    status: 'pending'
                })

            if (error) throw error

            toast.success('Report submitted. Thank you for your feedback.')
            onClose()
            setDescription('')
            setReason('inappropriate')
        } catch (error) {
            console.error('Error reporting ad:', error)
            toast.error('Failed to submit report. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Report Advertisement
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-400 hover:text-red-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-6">
                        We take ad quality seriously. Please let us know why this ad is problematic.
                        <br />
                        <span className="font-semibold text-gray-800 mt-2 block">Ad: {ad.title}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="inappropriate">Inappropriate Content</option>
                                <option value="fraud">Fraud or Scam</option>
                                <option value="spam">Spam or Repetitive</option>
                                <option value="misleading">Misleading Information</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                placeholder="Please provide more details..."
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading ? 'Submitting...' : (
                                    <>
                                        Submit Report <Send size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
