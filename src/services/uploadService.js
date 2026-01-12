import { supabase } from '../supabaseClient'

/**
 * Upload service for handling all file uploads to Supabase Storage
 */

/**
 * Upload a profile picture
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<{url: string, error: null}|{url: null, error: Error}>}
 */
export async function uploadProfilePicture(file, userId) {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(filePath)

        return { url: data.publicUrl, error: null }
    } catch (error) {
        console.error('Error uploading profile picture:', error)
        return { url: null, error }
    }
}

/**
 * Upload a banner image
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<{url: string, error: null}|{url: null, error: Error}>}
 */
export async function uploadBannerImage(file, userId) {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('banner-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
            .from('banner-images')
            .getPublicUrl(filePath)

        return { url: data.publicUrl, error: null }
    } catch (error) {
        console.error('Error uploading banner image:', error)
        return { url: null, error }
    }
}

/**
 * Upload a post media file (meme/video)
 * @param {File} file - The media file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<{url: string, error: null}|{url: null, error: Error}>}
 */
export async function uploadPostMedia(file, userId) {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('meme-uploads')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
            .from('meme-uploads')
            .getPublicUrl(filePath)

        return { url: data.publicUrl, error: null }
    } catch (error) {
        console.error('Error uploading post media:', error)
        return { url: null, error }
    }
}

/**
 * Delete a file from storage
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The path to the file
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteFile(bucket, filePath) {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath])

        if (error) throw error

        return { success: true, error: null }
    } catch (error) {
        console.error('Error deleting file:', error)
        return { success: false, error }
    }
}
