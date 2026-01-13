import { format } from 'date-fns'

export default function CustomDatePicker({ selected, onChange, minDate, className, ...props }) {
    // Convert Date object to YYYY-MM-DDTHH:mm string for input
    const formatDateForInput = (date) => {
        if (!date) return ''
        const d = new Date(date)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().slice(0, 16)
    }

    const handleChange = (e) => {
        const date = e.target.value ? new Date(e.target.value) : null
        onChange(date)
    }

    return (
        <input
            type="datetime-local"
            value={formatDateForInput(selected)}
            onChange={handleChange}
            min={formatDateForInput(minDate || new Date())}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white text-gray-700 font-medium ${className}`}
            {...props}
        />
    )
}
