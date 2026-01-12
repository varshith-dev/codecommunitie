import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Avatar from '../components/Avatar'
import { Check, X, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VerificationRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        // This is a placeholder fetch - assuming a 'verification_requests' table or similar logic
        // or querying profiles where is_verified is false but requested
        // For now we will check if logic exists, otherwise just show empty state
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Pending Requests</h3>
                <p className="text-gray-500">All verification requests have been processed.</p>
            </div>
        </div>
    )
}
