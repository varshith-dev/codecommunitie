import { supabase } from '../supabaseClient'

/**
 * Device Tracking Service
 * Tracks user devices, browsers, OS, IP addresses for security and analytics
 */

// Get device type from screen size and user agent
function getDeviceType() {
    const ua = navigator.userAgent
    const width = window.screen.width

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet'
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile'
    }
    return 'desktop'
}

// Parse browser info
function getBrowserInfo() {
    const ua = navigator.userAgent
    let browser = 'Unknown'

    if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edg')) browser = 'Edge'
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

    return browser
}

// Parse OS info
function getOSInfo() {
    const ua = navigator.userAgent
    let os = 'Unknown'

    if (ua.includes('Win')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'MacOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    return os
}

// Get IP address from external API
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
    } catch (error) {
        console.error('Failed to get IP:', error)
        return null
    }
}

// Get location from IP (optional - requires API key)
async function getLocation(ip) {
    try {
        // Using ipapi.co (free tier: 1000 requests/day)
        const response = await fetch(`https://ipapi.co/${ip}/json/`)
        const data = await response.json()
        return {
            country: data.country_name,
            city: data.city
        }
    } catch (error) {
        console.error('Failed to get location:', error)
        return { country: null, city: null }
    }
}

/**
 * Track device login
 * Called after successful authentication
 */
export async function trackDeviceLogin(userId) {
    try {
        const deviceType = getDeviceType()
        const browser = getBrowserInfo()
        const os = getOSInfo()
        const ipAddress = await getIPAddress()
        const location = ipAddress ? await getLocation(ipAddress) : { country: null, city: null }

        const deviceInfo = {
            user_id: userId,
            device_type: deviceType,
            browser: browser,
            os: os,
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
            location_country: location.country,
            location_city: location.city,
            last_login: new Date().toISOString()
        }

        // Try to update existing device, or insert new one
        const { data: existing } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .eq('device_type', deviceType)
            .eq('browser', browser)
            .eq('os', os)
            .eq('ip_address', ipAddress)
            .single()

        if (existing) {
            // Update existing device
            await supabase
                .from('user_devices')
                .update({
                    last_login: new Date().toISOString(),
                    login_count: existing.login_count + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
        } else {
            // Insert new device
            await supabase
                .from('user_devices')
                .insert(deviceInfo)
        }

        console.log('Device tracked successfully')
    } catch (error) {
        console.error('Device tracking error:', error)
        // Don't throw - device tracking shouldn't block login
    }
}

/**
 * Get user's devices
 */
export async function getUserDevices(userId) {
    const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_login', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Mark device as suspicious
 */
export async function markDeviceSuspicious(deviceId, suspicious = true) {
    const { error } = await supabase
        .from('user_devices')
        .update({ is_suspicious: suspicious })
        .eq('id', deviceId)

    if (error) throw error
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId) {
    const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId)

    if (error) throw error
}
