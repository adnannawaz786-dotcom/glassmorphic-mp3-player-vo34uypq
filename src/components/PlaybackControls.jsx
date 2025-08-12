import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle,
  RotateCcw
} from 'lucide-react';

const PlaybackControls = ({ 
  isPlaying, 
  onPlayPause, 
  onPrevious, 
  onNext, 
  volume, 
  onVolumeChange,
  onSeek,
  currentTime,
  duration,
  repeatMode,
  onRepeatChange,
  shuffleMode,
  onShuffleToggle,
  currentTrack
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleProgressChange = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    onSeek(newTime);
  };

  const handleProgressDrag = (e) => {
    if (isDragging) {
      handleProgressChange(e);
    }
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <RotateCcw className="w-4 h-4" />;
      case 'all':
        return <Repeat className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4" />;
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Track Info */}
      {currentTrack && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-1 truncate">
            {currentTrack.title || 'Unknown Title'}
          </h3>
          <p className="text-white/70 truncate">
            {currentTrack.artist || 'Unknown Artist'}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={handleProgressDrag}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-sm text-white/70 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {/* Shuffle */}
        <button
          onClick={onShuffleToggle}
          className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 ${
            shuffleMode 
              ? 'bg-white/30 text-white shadow-lg' 
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous */}
        <button
          onClick={onPrevious}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {/* Repeat */}
        <button
          onClick={onRepeatChange}
          className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 ${
            repeatMode !== 'off' 
              ? 'bg-white/30 text-white shadow-lg' 
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          {getRepeatIcon()}
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={handleVolumeToggle}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        
        <div className="relative w-32">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
          />
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: linear-gradient(135deg, #60a5fa, #a855f7);
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: linear-gradient(135deg, #60a5fa, #a855f7);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `}</style>
        </div>
        
        <span className="text-sm text-white/70 min-w-[3rem]">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};

export default PlaybackControls;