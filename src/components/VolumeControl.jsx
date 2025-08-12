import React, { useState, useRef, useEffect } from 'react';

const VolumeControl = ({ 
  volume = 50, 
  onVolumeChange, 
  isMuted = false, 
  onMuteToggle,
  className = "" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);
  const trackRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging && e.type === 'mousemove') return;
    
    const slider = sliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    onVolumeChange?.(Math.round(percentage));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      );
    } else if (volume < 30) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
        </svg>
      );
    } else if (volume < 70) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      );
    }
  };

  const displayVolume = isMuted ? 0 : volume;

  return (
    <div 
      className={`flex items-center gap-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Volume Icon Button */}
      <button
        onClick={onMuteToggle}
        className={`
          p-2 rounded-xl transition-all duration-300 relative group
          backdrop-blur-md bg-white/10 border border-white/20
          hover:bg-white/20 hover:border-white/30 hover:scale-110
          active:scale-95 shadow-lg hover:shadow-xl
          ${isMuted ? 'text-red-400' : 'text-white/90 hover:text-white'}
        `}
      >
        {getVolumeIcon()}
        
        {/* Icon glow effect */}
        <div className={`
          absolute inset-0 rounded-xl transition-opacity duration-300
          bg-gradient-to-r from-purple-500/20 to-pink-500/20
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `} />
      </button>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <div 
          ref={sliderRef}
          className={`
            relative w-24 h-2 rounded-full cursor-pointer transition-all duration-300
            backdrop-blur-md bg-white/10 border border-white/20
            hover:bg-white/15 hover:border-white/30 hover:h-3
            ${isDragging ? 'h-3 bg-white/20' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          {/* Track background */}
          <div 
            ref={trackRef}
            className="absolute inset-0 rounded-full overflow-hidden"
          >
            {/* Volume fill */}
            <div 
              className={`
                h-full rounded-full transition-all duration-200 relative
                bg-gradient-to-r from-purple-400 to-pink-400
                ${isDragging ? 'shadow-lg shadow-purple-500/30' : ''}
              `}
              style={{ width: `${displayVolume}%` }}
            >
              {/* Animated shine effect */}
              <div className={`
                absolute inset-0 rounded-full transition-opacity duration-300
                bg-gradient-to-r from-transparent via-white/30 to-transparent
                animate-pulse
                ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}
              `} />
            </div>
          </div>

          {/* Volume thumb */}
          <div 
            className={`
              absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
              transition-all duration-200 shadow-lg
              backdrop-blur-md bg-white border-2 border-white/30
              ${isDragging ? 'scale-125 shadow-xl shadow-purple-500/30' : ''}
              ${isHovered ? 'scale-110' : ''}
            `}
            style={{ 
              left: `calc(${displayVolume}% - 8px)`,
              background: isDragging 
                ? 'linear-gradient(45deg, #a855f7, #ec4899)' 
                : 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {/* Thumb glow */}
            <div className={`
              absolute inset-0 rounded-full transition-opacity duration-300
              bg-gradient-to-r from-purple-400 to-pink-400 blur-sm -z-10
              ${isDragging || isHovered ? 'opacity-60' : 'opacity-0'}
            `} />
          </div>

          {/* Hover glow effect */}
          <div className={`
            absolute inset-0 rounded-full transition-opacity duration-300 -z-10
            bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-md
            ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}
          `} />
        </div>

        {/* Volume percentage */}
        <span className={`
          text-xs font-medium min-w-[2rem] text-right transition-all duration-200
          ${isMuted ? 'text-red-400' : 'text-white/70'}
          ${isHovered || isDragging ? 'text-white scale-110' : ''}
        `}>
          {Math.round(displayVolume)}%
        </span>
      </div>
    </div>
  );
};

export default VolumeControl;