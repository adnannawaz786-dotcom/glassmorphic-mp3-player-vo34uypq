import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Plus, 
  X, 
  Music,
  Upload,
  List,
  Search
} from 'lucide-react';

const PlaylistPanel = ({ 
  playlist, 
  currentTrack, 
  isPlaying, 
  onTrackSelect, 
  onAddTrack, 
  onRemoveTrack,
  onPlayPause,
  onNext,
  onPrevious,
  shuffle,
  repeat,
  onShuffleToggle,
  onRepeatToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  const filteredPlaylist = playlist.filter(track =>
    track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const track = {
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Unknown Artist',
          duration: '0:00',
          url: url,
          file: file
        };
        onAddTrack(track);
      }
    });
    setShowAddForm(false);
  };

  const formatDuration = (duration) => {
    if (!duration || duration === '0:00') return '0:00';
    return duration;
  };

  return (
    <div className="h-full flex flex-col backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <List className="w-6 h-6" />
            Playlist
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 group"
          >
            <Plus className={`w-5 h-5 text-white transition-transform duration-300 ${showAddForm ? 'rotate-45' : 'group-hover:scale-110'}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-300"
          />
        </div>

        {/* Add Track Form */}
        {showAddForm && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/20 rounded-xl text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Audio Files
            </button>
          </div>
        )}
      </div>

      {/* Playlist Controls */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onShuffleToggle}
              className={`p-2 rounded-lg transition-all duration-300 ${
                shuffle 
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/20'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onRepeatToggle}
              className={`p-2 rounded-lg transition-all duration-300 ${
                repeat 
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/20'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevious}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onPlayPause}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border border-white/20 text-white transition-all duration-300"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onNext}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlaylist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60 p-8">
            <Music className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No tracks found</p>
            <p className="text-sm text-center">
              {searchTerm ? 'Try a different search term' : 'Add some music to get started'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredPlaylist.map((track, index) => (
              <div
                key={track.id}
                onClick={() => onTrackSelect(track)}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 mb-2 border ${
                  currentTrack?.id === track.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-white/20">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
                        <div className="w-1 h-6 bg-white rounded-full animate-pulse animation-delay-100"></div>
                        <div className="w-1 h-3 bg-white rounded-full animate-pulse animation-delay-200"></div>
                      </div>
                    ) : (
                      <Music className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-blue-300 transition-colors duration-300">
                      {track.name}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {track.artist}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPanel;