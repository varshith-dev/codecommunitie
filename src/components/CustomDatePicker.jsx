import React from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CustomDatePicker({
    selected,
    onChange,
    showTimeSelect = false,
    placeholderText = "Select date",
    minDate,
    className = "",
    ...props
}) {
    return (
        <div className="relative w-full">
            <DatePicker
                selected={selected}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
                placeholderText={placeholderText}
                minDate={minDate}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white text-gray-700 font-medium ${className}`}
                calendarClassName="shadow-2xl border border-gray-100 rounded-2xl overflow-hidden font-sans"
                dayClassName={() => "rounded-lg hover:bg-blue-50 transition-colors"}
                autoComplete="off"
                {...props}
                renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            type="button"
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-600 disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-gray-800 text-base">
                            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            type="button"
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-600 disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {showTimeSelect ? <Clock size={18} /> : <Calendar size={18} />}
            </div>
        </div>
    )
}
