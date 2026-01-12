/**
 * Skeleton loader components for various UI elements
 */

export function PostSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                <div className="h-48 bg-gray-200 rounded-xl" />
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-50 flex gap-6">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            {/* Banner */}
            <div className="h-32 bg-gray-200" />

            <div className="px-8 pb-8">
                {/* Avatar */}
                <div className="relative flex justify-between items-end -mt-12 mb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white" />
                    <div className="h-9 bg-gray-200 rounded-full w-32" />
                </div>

                {/* Info */}
                <div className="space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-48" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
            </div>
        </div>
    )
}

export function CommentSkeleton() {
    return (
        <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
        </div>
    )
}

export function UserCardSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-8 bg-gray-200 rounded-full w-20" />
        </div>
    )
}
