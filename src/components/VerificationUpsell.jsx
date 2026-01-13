import { useNavigate } from 'react-router-dom'
import { BadgeCheck, X } from 'lucide-react'

export default function VerificationUpsell({ onClose }) {
    const navigate = useNavigate()

    return (
        <div className="mt-6 bg-gradient-to-r from-blue-600/80 via-blue-600/70 to-blue-500/80 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-6 flex items-start justify-between animate-fade-in relative overflow-hidden group">
            {/* Glass Shine Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex-1 z-10">
                <div className="flex items-center gap-2 mb-2">
                    {/* Custom Icon styling if needed, keeping simple for now */}
                    <BadgeCheck className="text-white drop-shadow-sm" size={24} />
                    <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-md">GET VERIFIED</h3>
                </div>

                <p className="text-blue-50 text-sm mb-5 max-w-sm leading-relaxed font-medium drop-shadow-sm">
                    FOR EXCLUSIVE PREMIUM ACCESS
                </p>

                <button
                    onClick={() => navigate('/get-verified')}
                    className="bg-white text-blue-700 px-6 py-2 rounded-full text-sm font-black hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    :) VERIFY
                </button>
            </div>

            <button
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
            >
                <X size={20} />
            </button>
        </div>
    )
}
