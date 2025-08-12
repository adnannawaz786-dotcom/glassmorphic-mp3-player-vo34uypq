import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Music } from 'lucide-react';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [audioData, setAudioData] = useState(new Array(64).fill(0));
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  const tracks = [
    { title: "Ethereal Dreams", artist: "Synthwave Artist", duration: "3:45" },
    { title: "Neon Nights", artist: "Electronic Vibes", duration: "4:12" },
    { title: "Digital Horizon", artist: "Future Sound", duration: "3:28" },
    { title: "Cosmic Journey", artist: "Space Ambient", duration: "5:03" }
  ];

  useEffect(() => {
    const audio = audioRef.current;
    
    const setupAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      }
    };

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', setupAudioContext);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', setupAudioContext);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      const updateVisualizer = () => {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData([...dataArray]);
        animationRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioData(new Array(64).fill(0));
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    const clickX = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Main Player Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Album Art & Visualizer */}
          <div className="relative mb-8">
            <div className="w-64 h-64 mx-auto rounded-2xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
              <Music className="w-16 h-16 text-white/60" />
              
              {/* Audio Visualizer Overlay */}
              <div className="absolute inset-0 flex items-end justify-center space-x-1 p-4">
                {audioData.slice(0, 32).map((value, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-white/80 to-white/40 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(2, (value / 255) * 100)}%`,
                      width: '4px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {tracks[currentTrack].title}
            </h2>
            <p className="text-white/70">{tracks[currentTrack].artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div 
              className="h-2 bg-white/20 rounded-full cursor-pointer mb-2"
              onClick={handleProgressChange}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-full transition-all ${
                isShuffled ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button
              onClick={prevTrack}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            
            <button
              onClick={nextTrack}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setRepeatMode((prev) => (prev + 1) % 3)}
              className={`p-2 rounded-full transition-all ${
                repeatMode > 0 ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <button onClick={toggleMute} className="text-white/70 hover:text-white">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-white/20 rounded-full appearance-none slider"
            />
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src="/sample-audio.mp3"
          onEnded={nextTrack}
        />
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #ec4899);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default App;