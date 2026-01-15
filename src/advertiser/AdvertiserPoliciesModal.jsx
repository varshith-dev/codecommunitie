import { X, ShieldCheck, DollarSign, FileText } from 'lucide-react'

export default function AdvertiserPoliciesModal({ isOpen, onClose }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-blue-900">
                        <ShieldCheck className="text-blue-600" />
                        <h2 className="text-xl font-bold">Advertising Policies & Rates</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8">

                    {/* Ad Rates Section */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-600" size={20} />
                            Real-time Ad Rates
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <p className="text-xs font-bold text-green-700 uppercase mb-1">Cost Per Click (CPC)</p>
                                <p className="text-3xl font-black text-green-900">5.00 <span className="text-sm font-medium text-green-700">credits</span></p>
                                <p className="text-xs text-green-600 mt-2">Deducted when a user clicks your ad</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Cost Per 1000 Impressions (CPM)</p>
                                <p className="text-3xl font-black text-blue-900">2.00 <span className="text-sm font-medium text-blue-700">credits</span></p>
                                <p className="text-xs text-blue-600 mt-2">Deducted for every 1k views (Coming Soon)</p>
                            </div>
                        </div>
                    </section>

                    {/* Policies Section */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="text-purple-600" size={20} />
                            Content Guidelines
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4 text-sm text-gray-700">
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                <p><span className="font-bold text-gray-900">No Prohibited Content:</span> Ads must not contain nudity, violence, hate speech, illegal products, or misleading claims.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                <p><span className="font-bold text-gray-900">Quality Standards:</span> Images must be high-resolution. Text must be grammatically correct and typo-free.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                <p><span className="font-bold text-gray-900">Landing Pages:</span> Destination URLs must match the ad content and load clearly functioning pages.</p>
                            </div>
                        </div>
                    </section>

                    {/* Terms */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Terms of Service</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            By placing an ad on CodeKrafts, you agree to our Advertising Terms. We reserve the right to reject or remove ads that violate our policies.
                            Refunds are only processed for remaining budget on cancelled campaigns. Budget is deducted in real-time.
                        </p>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    )
}
