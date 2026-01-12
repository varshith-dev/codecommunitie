import { useState } from 'react'
import { X, Hash } from 'lucide-react'

export default function TagInput({ tags, onChange, maxTags = 5 }) {
    const [inputValue, setInputValue] = useState('')
    const [suggestions] = useState([
        'javascript', 'python', 'react', 'nodejs', 'typescript',
        'tutorial', 'beginner', 'advanced', 'webdev', 'frontend',
        'backend', 'fullstack', 'meme', 'funny', 'tips'
    ])

    const addTag = (tagName) => {
        const normalized = tagName.toLowerCase().trim().replace(/\s+/g, '-')

        if (!normalized) return
        if (tags.length >= maxTags) {
            return
        }
        if (tags.includes(normalized)) {
            return
        }

        onChange([...tags, normalized])
        setInputValue('')
    }

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (inputValue.trim()) {
                addTag(inputValue)
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            // Remove last tag on backspace if input is empty
            removeTag(tags[tags.length - 1])
        }
    }

    const filteredSuggestions = suggestions.filter(
        s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 5)

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags <span className="text-gray-400">(Optional, max {maxTags})</span>
            </label>

            {/* Tags Display */}
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                    >
                        <Hash size={14} />
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
            </div>

            {/* Input */}
            {tags.length < maxTags && (
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="Type a tag and press Enter..."
                    />

                    {/* Suggestions */}
                    {inputValue && filteredSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                            {filteredSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => addTag(suggestion)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Hash size={14} className="text-gray-400" />
                                    <span className="text-sm">{suggestion}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-gray-400 mt-1">
                Press Enter or comma to add a tag
            </p>
        </div>
    )
}
