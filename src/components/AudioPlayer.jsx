import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';

const AudioPlayer = ({ currentTrack, playlist, onTrackChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none, one, all
  const [visualizerData, setVisualizerData] = useState([]);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleTrackEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, []);

  const initializeAudioContext = async () => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioRef.current);
        
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        startVisualization();
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const animate = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      setVisualizerData([...dataArray]);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioContextRef.current) {
        await initializeAudioContext();
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === 'all' || !repeatMode) {
      skipForward();
    } else {
      setIsPlaying(false);
    }
  };

  const skipForward = () => {
    if (!playlist || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    let nextIndex;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    onTrackChange(playlist[nextIndex]);
  };

  const skipBack = () => {
    if (!playlist || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    onTrackChange(playlist[prevIndex]);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 p-6">
      <audio ref={audioRef} />
      
      {/* Visualizer */}
      <div className="flex justify-center mb-6">
        <div className="flex items-end space-x-1 h-16">
          {Array.from({ length: 32 }).map((_, i) => {
            const height = visualizerData[i] ? (visualizerData[i] / 255) * 100 : 5;
            return (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(height, 5)}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Track Info */}
      {currentTrack && (
        <div className="text-center mb-4">
          <h3 className="text-white font-semibold text-lg">{currentTrack.title}</h3>
          <p className="text-white/70">{currentTrack.artist}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-white/70 text-sm mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-6">
        <button
          onClick={() => setIsShuffled(!isShuffled)}
          className={`p-2 rounded-full transition-all ${
            isShuffled ? 'text-purple-400 bg-white/20' : 'text-white/70 hover:text-white'
          }`}
        >
          <Shuffle size={20} />
        </button>

        <button
          onClick={skipBack}
          className="p-3 text-white/70 hover:text-white transition-colors"
        >
          <SkipBack size={24} />
        </button>

        <button
          onClick={togglePlay}
          className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button
          onClick={skipForward}
          className="p-3 text-white/70 hover:text-white transition-colors"
        >
          <SkipForward size={24} />
        </button>

        <button
          onClick={() => setRepeatMode(repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none')}
          className={`p-2 rounded-full transition-all ${
            repeatMode !== 'none' ? 'text-purple-400 bg-white/20' : 'text-white/70 hover:text-white'
          }`}
        >
          <Repeat size={20} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center mt-4 space-x-3">
        <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default AudioPlayer;