import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [showOffline, setShowOffline] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            setShowOffline(false)
        }

        const handleOffline = () => {
            setIsOnline(false)
            setShowOffline(true)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check initial state
        if (!navigator.onLine) {
            setShowOffline(true)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const handleRefresh = () => {
        window.location.reload()
    }

    if (!showOffline) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm animate-fade-in">
            <div className="max-w-md mx-4 text-center">
                {/* Offline Icon */}
                <div className="mb-6 relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center animate-pulse">
                        <WifiOff size={64} className="text-white" />
                    </div>
                    <div className="absolute inset-0 w-32 h-32 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-2xl"></div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-white mb-3">
                    You're Offline
                </h1>
                <p className="text-gray-300 text-lg mb-8">
                    No internet connection detected. Please check your network and try again.
                </p>

                {/* Retry Button */}
                <button
                    onClick={handleRefresh}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-3 mx-auto group"
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Retry Connection
                </button>

                {/* Helper Text */}
                <p className="text-gray-400 text-sm mt-6">
                    Tip: Check your WiFi or mobile data connection
                </p>
            </div>
        </div>
    )
}
