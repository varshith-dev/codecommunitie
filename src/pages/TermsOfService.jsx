import { Link } from 'react-router-dom'
import { ArrowLeft, Code2 } from 'lucide-react'

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Code2 size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900">CodeKrafts</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-gray-500 mb-8">Last updated: January 2024</p>

                    <div className="prose prose-gray max-w-none">
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 mb-4">
                            By accessing or using CodeKrafts, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. User Accounts</h2>
                        <p className="text-gray-600 mb-4">
                            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>You are responsible for safeguarding your password</li>
                            <li>You agree not to share your account credentials</li>
                            <li>You must notify us immediately of any unauthorized access</li>
                            <li>You must be at least 13 years old to use this service</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. User Content</h2>
                        <p className="text-gray-600 mb-4">
                            You retain ownership of any content you post on CodeKrafts. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on our platform.
                        </p>
                        <p className="text-gray-600 mb-4">You agree not to post content that:</p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Is unlawful, harmful, threatening, or harassing</li>
                            <li>Infringes on intellectual property rights</li>
                            <li>Contains malicious code or viruses</li>
                            <li>Violates the privacy of others</li>
                            <li>Is spam or commercial solicitation</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Code Sharing</h2>
                        <p className="text-gray-600 mb-4">
                            When sharing code on CodeKrafts, ensure you have the right to share such code. Do not share proprietary code, trade secrets, or code that violates third-party licenses without proper authorization.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Verification</h2>
                        <p className="text-gray-600 mb-4">
                            Verified accounts receive additional features. To become verified, you must provide accurate identification information. Misrepresentation may result in account termination.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Prohibited Activities</h2>
                        <p className="text-gray-600 mb-4">You agree not to:</p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Use automated systems to access the service without permission</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with the proper functioning of the service</li>
                            <li>Impersonate other users or entities</li>
                            <li>Use the service for any illegal purpose</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Termination</h2>
                        <p className="text-gray-600 mb-4">
                            We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the service will cease immediately.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Disclaimer</h2>
                        <p className="text-gray-600 mb-4">
                            CodeKrafts is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Changes to Terms</h2>
                        <p className="text-gray-600 mb-4">
                            We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Contact</h2>
                        <p className="text-gray-600 mb-4">
                            If you have any questions about these Terms, please contact us at <b>varshith@truvgo.me</b>.
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                        <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                        <span className="text-gray-300">|</span>
                        <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
