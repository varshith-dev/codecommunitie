import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, MoreVertical } from 'lucide-react'

// Helper if utility doesn't exist yet
const formatDuration = (seconds) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, title, poster, className = "" }) {
    const videoRef = useRef(null)
    const containerRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)

    // Hide controls timeout
    const controlsTimeoutRef = useRef(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const updateProgress = () => setProgress((video.currentTime / video.duration) * 100)
        const updateDuration = () => setDuration(video.duration)
        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)
        const onEnded = () => setIsPlaying(false)

        video.addEventListener('timeupdate', updateProgress)
        video.addEventListener('loadedmetadata', updateDuration)
        video.addEventListener('play', onPlay)
        video.addEventListener('pause', onPause)
        video.addEventListener('ended', onEnded)

        return () => {
            video.removeEventListener('timeupdate', updateProgress)
            video.removeEventListener('loadedmetadata', updateDuration)
            video.removeEventListener('play', onPlay)
            video.removeEventListener('pause', onPause)
            video.removeEventListener('ended', onEnded)
        }
    }, [])

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play()
        } else {
            videoRef.current.pause()
        }
    }

    const toggleMute = () => {
        const video = videoRef.current
        video.muted = !video.muted
        setIsMuted(video.muted)
        if (video.muted) {
            setVolume(0)
        } else {
            setVolume(1)
            video.volume = 1
        }
    }

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        videoRef.current.volume = newVolume
        setIsMuted(newVolume === 0)
    }

    const handleSeek = (e) => {
        const seekTime = (parseFloat(e.target.value) / 100) * duration
        videoRef.current.currentTime = seekTime
        setProgress(parseFloat(e.target.value))
    }

    const toggleFullscreen = async () => {
        const container = containerRef.current
        if (!document.fullscreenElement) {
            try {
                await container.requestFullscreen()
                setIsFullscreen(true)
            } catch (err) {
                console.error("Error attempting to enable fullscreen:", err)
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    // Handle fullscreen change events (ESC key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const handleMouseMove = () => {
        setShowControls(true)
        clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false)
        }, 3000)
    }

    const changeSpeed = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate
        }
        setPlaybackRate(rate)
        setShowSettings(false)
    }

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
        // Only trigger if player is focused or fullscreen
        // We also allow it if the container or video is the active element
        // But simply checking focus on container is best
        if (document.activeElement !== containerRef.current && !isFullscreen) return

        switch (e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault()
                togglePlay()
                break
            case 'm':
                toggleMute()
                break
            case 'f':
                toggleFullscreen()
                break
            case 'arrowleft':
                e.preventDefault()
                if (videoRef.current) videoRef.current.currentTime -= 5
                break
            case 'arrowright':
                e.preventDefault()
                if (videoRef.current) videoRef.current.currentTime += 5
                break
            case 'arrowup':
                e.preventDefault()
                const newVolUp = Math.min(volume + 0.1, 1)
                setVolume(newVolUp)
                if (videoRef.current) videoRef.current.volume = newVolUp
                setIsMuted(false)
                break
            case 'arrowdown':
                e.preventDefault()
                const newVolDown = Math.max(volume - 0.1, 0)
                setVolume(newVolDown)
                if (videoRef.current) videoRef.current.volume = newVolDown
                break
        }
    }

    return (
        <div
            ref={containerRef}
            className={`relative group bg-black rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isFullscreen ? 'w-full h-full flex items-center justify-center' : ''} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onContextMenu={(e) => e.preventDefault()} // Disable context menu
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* Title Overlay in Fullscreen */}
            {isFullscreen && showControls && (
                <div className="absolute top-0 left-0 p-6 z-20 w-full bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <h2 className="text-white text-xl font-bold drop-shadow-md">{title || 'Video'}</h2>
                </div>
            )}

            <video
                ref={videoRef}
                src={`${src}#t=0.001`} // Force first frame as thumbnail
                className={`w-full max-h-[85vh] object-contain ${isFullscreen ? 'h-full max-h-none' : ''}`}
                poster={poster}
                onClick={togglePlay}
                playsInline
                preload="metadata"
            />

            {/* Play/Pause Overlay Icon (Center) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:bg-black/10 transition-colors">
                    <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full text-white ring-1 ring-white/20 shadow-xl pointer-events-auto cursor-pointer hover:bg-black/60 hover:scale-105 transition-all" onClick={togglePlay}>
                        <Play size={32} fill="currentColor" className="ml-1" />
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

                {/* Progress Bar */}
                <div className="relative group/progress h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer">
                    <div
                        className="absolute h-full bg-blue-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {/* Scrubber Knob (visible on hover) */}
                    <div
                        className="absolute h-3 w-3 bg-white rounded-full -top-[3px] shadow opacity-0 group-hover/progress:opacity-100 pointer-events-none transition-opacity"
                        style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 h-1 accent-white bg-white/20 rounded-lg cursor-pointer opacity-0 group-hover/volume:opacity-100"
                            />
                        </div>

                        <span className="text-white/80 text-xs font-mono">
                            {formatDuration(videoRef.current?.currentTime)} / {formatDuration(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Settings / Speed */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`text-white hover:text-white/80 transition-colors ${showSettings ? 'rotate-45' : ''}`}
                            >
                                <Settings size={20} />
                            </button>

                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[120px] shadow-xl overflow-hidden animate-slide-up">
                                    <div className="p-2 text-xs font-semibold text-gray-400 border-b border-white/10 mb-1">Playback Speed</div>
                                    {[0.5, 1, 1.5, 2].map(rate => (
                                        <button
                                            key={rate}
                                            onClick={() => changeSpeed(rate)}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 flex items-center justify-between ${playbackRate === rate ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                                        >
                                            {rate}x
                                            {playbackRate === rate && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
