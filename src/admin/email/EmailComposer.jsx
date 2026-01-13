import React, { useState, useEffect } from 'react'
import { Send, User, Mail, FileText, Eye, Code, Wand2, KeyRound, Sparkles, Megaphone, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../supabaseClient'
import { EmailService } from '../../services/EmailService'
import { EmailTemplates, wrapInTemplate } from '../../services/EmailTemplates'

export default function EmailComposer({ preSelectedUsers = [], onClearSelection }) {
    const [config, setConfig] = useState({
        memberName: '', // Used for preview
        recipientEmail: '', // Used for manual single send
        subject: '',
        htmlContent: '',
    })

    const [activeTab, setActiveTab] = useState('preview')
    const [isSending, setIsSending] = useState(false)
    const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0, recipient: '' })

    const [userSearch, setUserSearch] = useState('')
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null) // For manual single selection from list
    const [currentTemplateType, setCurrentTemplateType] = useState('CUSTOM')

    // Effect: Handle pre-selected users from Audience tab
    useEffect(() => {
        if (preSelectedUsers.length > 0) {
            // Setup for bulk mode
            setConfig(prev => ({
                ...prev,
                // If multiple, generic subject. If single, maybe personalized.
                subject: prev.subject || 'Notification from CodCommunitie',
                recipientEmail: preSelectedUsers.length === 1 ? (preSelectedUsers[0].email || '') : ''
            }))
            // If just one, select it for preview
            if (preSelectedUsers.length === 1) {
                applyTemplate(currentTemplateType, preSelectedUsers[0])
            }
        }
    }, [preSelectedUsers])

    // Load initial users for the sidebar list
    useEffect(() => {
        fetchUsers()
        // Default template
        applyTemplate('WELCOME')
    }, [])

    const fetchUsers = async () => {
        // Fetch a small list for quick selection
        const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, website, email') // fetching email if available
            .limit(20)
        if (data) setUsers(data)
    }

    const applyTemplate = (type, userData = null) => {
        // If we have a selected user (either manual or 1 from audience), use them for preview
        const targetUser = userData || selectedUser || (preSelectedUsers.length === 1 ? preSelectedUsers[0] : null) || { full_name: 'Developer', username: 'dev' }

        const name = targetUser.full_name || targetUser.username || 'Developer'

        // Fetch Template Definition
        const templateDef = EmailTemplates[type] || { subject: () => '', body: () => '' }

        const subject = templateDef.subject(name)
        const body = templateDef.body(name)
        const title = templateDef.title || "Message" // Use template specific title or fallback

        const fullHtml = wrapInTemplate(body, title) // Pass title to wrapper

        setConfig(prev => ({
            ...prev,
            memberName: name,
            subject: subject,
            htmlContent: fullHtml,
            // Only overwrite email if we are in single mode
            recipientEmail: (targetUser.email && preSelectedUsers.length <= 1) ? targetUser.email : prev.recipientEmail
        }))

        setCurrentTemplateType(type)
        if (userData) setSelectedUser(userData)
    }

    const handleSend = async () => {
        if (!window.confirm(`Are you sure you want to send this email?`)) return
        setIsSending(true)

        // Determine Mode: Bulk selection or Single Manual
        const recipients = preSelectedUsers.length > 0 ? preSelectedUsers : [{ email: config.recipientEmail, full_name: config.memberName }]

        setSendingProgress({ current: 0, total: recipients.length, recipient: '' })

        let successCount = 0
        let failCount = 0

        // Use the current HTML content from the editor
        // Note: The HTML might contain "Developer" if generated from template. 
        // For bulk sending, we ideally want to re-generate the body for each user to personalize NAME.
        // However, if the admin EDITED the HTML manually, we can't easily re-inject names without simple find/replace.
        // Strategy: basic string replace of current preview name with new user name? Or just send generic if edited?
        // Simple approach: personalized templates re-render. Custom HTML sends as is.

        const isCustomEdit = currentTemplateType === 'CUSTOM' // Determine if we should preserve exact HTML

        for (let i = 0; i < recipients.length; i++) {
            const user = recipients[i]
            const email = user.email || user.recipientEmail // Handle different structures
            if (!email) {
                failCount++
                continue
            }

            setSendingProgress({ current: i + 1, total: recipients.length, recipient: email })

            // Personalize Content if possible
            let finalHtml = config.htmlContent
            let finalSubject = config.subject

            // If we are using a standard template type, RE-GENERATE for this user to get correct name
            if (!isCustomEdit && EmailTemplates[currentTemplateType]) {
                const name = user.full_name || user.display_name || user.username || 'Developer'
                finalHtml = wrapInTemplate(EmailTemplates[currentTemplateType].body(name))
                finalSubject = EmailTemplates[currentTemplateType].subject(name)
            }
            // Else use the editor state (which might have "Hello Developer")

            try {
                await EmailService.send({
                    recipientEmail: email,
                    memberName: user.full_name || 'Developer',
                    subject: finalSubject,
                    htmlContent: finalHtml,
                    templateType: currentTemplateType,
                    triggeredBy: 'admin_bulk'
                })
                successCount++
            } catch (error) {
                console.error(`Failed to send to ${email}`, error)
                failCount++
            }
        }

        setIsSending(false)
        toast.success(`Sent: ${successCount}, Failed: ${failCount}`)

        if (onClearSelection && preSelectedUsers.length > 0) {
            onClearSelection()
        }
    }

    // Interactive Template Button Component
    const TemplateBtn = ({ type, icon: Icon, label, desc, color }) => (
        <button
            onClick={() => applyTemplate(type)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-${color}-50 hover:text-${color}-700 rounded-lg transition-colors border border-transparent hover:border-${color}-100 group`}
        >
            <div className={`p-1.5 bg-${color}-100 text-${color}-600 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all`}>
                <Icon size={16} />
            </div>
            <div className="text-left">
                <div className="font-medium">{label}</div>
                <div className="text-[10px] text-gray-400">{desc}</div>
            </div>
        </button>
    )

    return (
        <div className="h-full flex flex-col">
            {/* Header / Context */}
            {preSelectedUsers.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                        <User size={16} />
                        You are composing an email for <span className="font-bold underline">{preSelectedUsers.length} selected users</span>.
                    </div>
                    <button onClick={onClearSelection} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6 min-h-0 flex-1">
                {/* SETTINGS PANEL */}
                <div className="col-span-12 lg:col-span-3 flex flex-col h-full min-h-0">

                    {/* Scrollable Area: Users & Templates */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {/* User Select (Only show if not bulk mode) */}
                        {preSelectedUsers.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Select</h3>
                                <div className="relative mb-2">
                                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Find user..."
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                    {users.filter(u => u.username?.includes(userSearch)).map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUser(user)
                                                applyTemplate(currentTemplateType, user)
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs rounded flex items-center justify-between ${selectedUser?.id === user.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span className="truncate">@{user.username}</span>
                                            {selectedUser?.id === user.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEMPLATES */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Templates</h3>
                            <div className="space-y-1">
                                <TemplateBtn type="WELCOME" icon={Sparkles} label="Welcome Email" desc="Onboarding sequence" color="indigo" />
                                <TemplateBtn type="OTP" icon={KeyRound} label="Send OTP" desc="Verification code" color="emerald" />
                                <TemplateBtn type="RESET_PASSWORD" icon={Wand2} label="Reset Password" desc="Recovery link" color="amber" />
                                <TemplateBtn type="VERIFIED_BADGE" icon={User} label="Verified Badge" desc="Blue checkmark" color="blue" />
                                <TemplateBtn type="BETA_ACCESS" icon={Code} label="Beta Access" desc="Feature invite" color="purple" />
                                <TemplateBtn type="PRODUCT_UPDATE" icon={Megaphone} label="Product Update" desc="Announcement" color="pink" />
                            </div>
                        </div>
                    </div>

                    {/* SEND FORM (Fixed at bottom) */}
                    <div className="pt-4 shrink-0">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Configuration</h3>

                            {preSelectedUsers.length === 0 && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Recipient</label>
                                    <input
                                        value={config.recipientEmail}
                                        onChange={e => setConfig({ ...config, recipientEmail: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Subject Line</label>
                                <input
                                    value={config.subject}
                                    onChange={e => setConfig({ ...config, subject: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={isSending || (preSelectedUsers.length === 0 && !config.recipientEmail)}
                                className="w-full mt-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSending ? (
                                    <span className="flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Sending {sendingProgress.current}/{sendingProgress.total}...
                                    </span>
                                ) : (
                                    <><Send size={18} /> Send Campaign</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* EDITOR / PREVIEW */}
                <div className="col-span-12 lg:col-span-9 h-full min-h-0 flex flex-col">
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Visual Preview
                                </button>
                                <button
                                    onClick={() => setActiveTab('code')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    HTML Source
                                </button>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                                Template: {currentTemplateType}
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 relative">
                            {activeTab === 'preview' ? (
                                <iframe
                                    title="Email Preview"
                                    srcDoc={config.htmlContent}
                                    className="w-full h-full border-none"
                                />
                            ) : (
                                <textarea
                                    value={config.htmlContent}
                                    onChange={(e) => {
                                        setConfig({ ...config, htmlContent: e.target.value })
                                        setCurrentTemplateType('CUSTOM')
                                    }}
                                    className="w-full h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none"
                                    spellCheck="false"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
