import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Check, X, Eye, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MediaReview() {
    const [media, setMedia] = useState([])
    const [loading, setLoading] = useState(true)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Media Review</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Media to Review</h3>
                <p className="text-gray-500">There is no content flagged for moderation at this time.</p>
            </div>
        </div>
    )
}
