import { Link } from 'react-router-dom'
import { ArrowLeft, Code2 } from 'lucide-react'

export default function PrivacyPolicy() {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8">Last updated: January 2024</p>

                    <div className="prose prose-gray max-w-none">
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            We collect information you provide directly to us, such as when you create an account, post content, or contact us for support.
                        </p>
                        <p className="text-gray-600 mb-4">This includes:</p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li><strong>Account Information:</strong> Email address, username, password, and profile details</li>
                            <li><strong>Content:</strong> Code snippets, posts, comments, and media you upload</li>
                            <li><strong>Verification Data:</strong> Identity documents if you apply for verification</li>
                            <li><strong>Usage Data:</strong> How you interact with our service</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">We use the information we collect to:</p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your account and verification requests</li>
                            <li>Send you notifications and updates</li>
                            <li>Respond to your comments and questions</li>
                            <li>Detect and prevent fraud and abuse</li>
                            <li>Comply with legal obligations</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
                        <p className="text-gray-600 mb-4">
                            We do not sell your personal information. We may share your information in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li><strong>Public Content:</strong> Posts and code snippets you share publicly are visible to all users</li>
                            <li><strong>Service Providers:</strong> Third parties who help us operate our service</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
                        <p className="text-gray-600 mb-4">
                            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
                        <p className="text-gray-600 mb-4">
                            We retain your information as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time through your settings.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
                        <p className="text-gray-600 mb-4">You have the right to:</p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Delete your account and data</li>
                            <li>Export your data</li>
                            <li>Opt out of marketing communications</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Cookies</h2>
                        <p className="text-gray-600 mb-4">
                            We use cookies and similar technologies to provide and improve our service. Essential cookies are required for basic functionality. You can manage cookie preferences in your browser settings.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
                        <p className="text-gray-600 mb-4">
                            Our service may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
                        <p className="text-gray-600 mb-4">
                            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
                        <p className="text-gray-600 mb-4">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
                        <p className="text-gray-600 mb-4">
                            If you have any questions about this Privacy Policy, please contact us at privacy@codekrafts.com.
                        </p>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                        <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                        <span className="text-gray-300">|</span>
                        <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
