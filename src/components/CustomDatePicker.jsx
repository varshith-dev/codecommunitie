import { format } from 'date-fns'

export default function CustomDatePicker({ selected, onChange, minDate, className, showTimeSelect = true, ...props }) {
    // Convert Date object to string based on type
    const formatDateForInput = (date) => {
        if (!date) return ''
        const d = new Date(date)
        // Adjust for timezone offset to keep date consistent
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())

        if (showTimeSelect) {
            return d.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
        } else {
            return d.toISOString().split('T')[0] // YYYY-MM-DD
        }
    }

    const handleChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null
        onChange(date)
    }

    return (
        <input
            type={showTimeSelect ? "datetime-local" : "date"}
            value={formatDateForInput(selected)}
            onChange={handleChange}
            min={minDate ? formatDateForInput(minDate) : undefined}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white text-gray-700 font-medium ${className}`}
            {...props}
        />
    )
}
