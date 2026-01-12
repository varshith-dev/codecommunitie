import { formatDistanceToNow } from 'date-fns'

/**
 * Converts a date to "time ago" format
 * @param {string|Date} date - The date to convert
 * @returns {string} - Formatted string like "2 hours ago"
 */
export function timeAgo(date) {
  if (!date) return 'Unknown'
  
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Unknown'
  }
}

/**
 * Converts a date to a short format
 * @param {string|Date} date - The date to convert
 * @returns {string} - Formatted string like "Jan 11, 2026"
 */
export function formatDate(date) {
  if (!date) return ''
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}
