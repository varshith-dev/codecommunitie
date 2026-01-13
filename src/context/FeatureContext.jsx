import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const FeatureContext = createContext()

/**
 * FeatureProvider
 * Loads global feature flags and user-specific permissions.
 * Exposes a `hasFeature(featureId)` function to checks if a user can access a feature.
 */
export function FeatureProvider({ children, session }) {
    const [features, setFeatures] = useState({})
    const [userAccess, setUserAccess] = useState(new Set())
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    // Initial Load
    useEffect(() => {
        const loadFeatures = async () => {
            try {
                setLoading(true)

                // 1. Load All Feature Flags
                const { data: flags, error: flagsError } = await supabase
                    .from('feature_flags')
                    .select('id, is_enabled, is_beta')

                if (flagsError) throw flagsError

                // Map to object for O(1) lookup
                const featureMap = {}
                flags?.forEach(f => {
                    featureMap[f.id] = f
                })
                setFeatures(featureMap)

                // 2. If logged in, load User Access Overrides & Role
                if (session?.user) {
                    // Check if admin
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (profile?.role === 'admin') {
                        setIsAdmin(true)
                    }

                    const { data: access, error: accessError } = await supabase
                        .from('user_feature_access')
                        .select('feature_id')
                        .eq('user_id', session.user.id)

                    if (accessError) throw accessError

                    const accessSet = new Set(access?.map(a => a.feature_id) || [])
                    setUserAccess(accessSet)
                }

            } catch (error) {
                console.error('Error loading features:', error)
            } finally {
                setLoading(false)
            }
        }

        loadFeatures()
    }, [session])

    /**
     * hasFeature
     * Checks if a feature is available to the current user.
     * Logic:
     * 1. If feature doesn't exist -> False
     * 2. If user explicitly granted access (override) -> True
     * 3. If feature is global enabled -> True
     * 4. Else -> False
     * 
     * @param {string} featureId 
     * @returns {boolean}
     */
    const hasFeature = (featureId) => {
        // Normalize ID
        const fid = featureId.toLowerCase()
        const feature = features[fid]

        // 1. Admins have access to everything
        if (isAdmin) return true

        // 2. Unknown feature
        if (!feature) return false

        // 3. User specific access (Beta testers etc)
        if (userAccess.has(fid)) return true

        // 4. Global Enable
        return feature.is_enabled
    }

    /**
     * isBeta
     * Checks if a feature is marked as beta
     */
    const isBeta = (featureId) => {
        const feature = features[featureId.toLowerCase()]
        return feature?.is_beta || false
    }

    return (
        <FeatureContext.Provider value={{ hasFeature, isBeta, loading, features }}>
            {children}
        </FeatureContext.Provider>
    )
}

export const useFeature = () => useContext(FeatureContext)

/**
 * FeatureGate Component
 * Wraps content and only shows it if the feature is enabled/accessible.
 */
export const FeatureGate = ({ feature, children, fallback = null }) => {
    const { hasFeature, loading } = useFeature()

    // Optionally handle loading state
    if (loading) return null

    if (hasFeature(feature)) {
        return children
    }
    return fallback
}
