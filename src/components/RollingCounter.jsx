import { useEffect, useState } from 'react'

export default function RollingCounter({ value, duration = 1000, prefix = '' }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime
        const startValue = count
        const change = value - startValue

        if (change === 0) return

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = timestamp - startTime

            if (progress < duration) {
                const nextValue = Math.round(startValue + (change * (progress / duration)))
                setCount(nextValue)
                requestAnimationFrame(animate)
            } else {
                setCount(value)
            }
        }

        requestAnimationFrame(animate)
    }, [value, duration])

    return (
        <span>
            {prefix}{count.toLocaleString()}
        </span>
    )
}
