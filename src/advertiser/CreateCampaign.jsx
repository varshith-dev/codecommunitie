import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, Calendar, Target, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateCampaign({ session }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: '',
        start_date: '',
        end_date: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase
                .from('ad_campaigns')
                .insert([{
                    advertiser_id: session.user.id,
                    name: formData.name,
                    description: formData.description,
                    budget: parseFloat(formData.budget),
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    status: 'draft'
                }])
                .select()
                .single()

            if (error) throw error

            toast.success('Campaign created successfully!')
            navigate(`/advertiser/campaign/${data.id}`)
        } catch (error) {
            console.error('Error creating campaign:', error)
            toast.error(error.message || 'Failed to create campaign')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/advertiser/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
                <p className="text-gray-600 mt-1">Set up your advertising campaign</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="space-y-6">
                    {/* Campaign Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Campaign Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Summer Product Launch"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                            rows="4"
                            placeholder="Describe your campaign goals and target audience..."
                        />
                    </div>

                    {/* Budget */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Budget ($) *
                        </label>
                        <div className="relative">
                            <DollarSign
                                size={20}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                placeholder="1000.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <div className="relative">
                                <Calendar
                                    size={20}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                End Date *
                            </label>
                            <div className="relative">
                                <Calendar
                                    size={20}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex gap-3">
                            <Target className="text-blue-600 flex-shrink-0" size={20} />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Next Steps</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    After creating your campaign, you'll be able to add advertisements, set targeting options, and launch your campaign.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/advertiser/dashboard')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={20} />
                                Creating...
                            </>
                        ) : (
                            'Create Campaign'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
