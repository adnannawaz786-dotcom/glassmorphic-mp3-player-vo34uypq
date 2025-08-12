import React from 'react';
import { Music, Heart, MoreHorizontal, Share2, Download } from 'lucide-react';

const TrackInfo = ({ 
  currentTrack, 
  isPlaying, 
  onToggleFavorite,
  onShare,
  onDownload 
}) => {
  const defaultTrack = {
    title: 'Select a Track',
    artist: 'No Artist',
    album: 'Unknown Album',
    duration: '0:00',
    artwork: null,
    isFavorite: false,
    genre: 'Unknown',
    year: '',
    bitrate: '',
    fileSize: ''
  };

  const track = currentTrack || defaultTrack;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatBitrate = (bitrate) => {
    if (!bitrate) return '';
    return `${bitrate} kbps`;
  };

  return (
    <div className="relative">
      {/* Main Track Info Container */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
        {/* Album Art and Basic Info */}
        <div className="flex items-start gap-6 mb-6">
          {/* Album Art */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 shadow-lg">
              {track.artwork ? (
                <img 
                  src={track.artwork} 
                  alt={`${track.album} artwork`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>
            
            {/* Playing Indicator */}
            {isPlaying && currentTrack && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-1 truncate">
              {track.title}
            </h2>
            <p className="text-white/70 text-sm mb-1 truncate">
              {track.artist}
            </p>
            <p className="text-white/50 text-xs truncate">
              {track.album}
            </p>
            
            {/* Duration */}
            <div className="mt-2 text-xs text-white/60">
              Duration: {track.duration}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onToggleFavorite?.(track)}
              className={`p-2 rounded-lg backdrop-blur-sm border border-white/10 transition-all duration-200 hover:scale-105 ${
                track.isFavorite 
                  ? 'bg-red-500/20 text-red-400 border-red-400/30' 
                  : 'bg-white/5 text-white/60 hover:text-white/80'
              }`}
              disabled={!currentTrack}
            >
              <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <div className="relative group">
              <button className="p-2 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10 text-white/60 hover:text-white/80 transition-all duration-200 hover:scale-105">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-36 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={() => onShare?.(track)}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-t-lg transition-colors duration-200 flex items-center gap-2"
                  disabled={!currentTrack}
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button
                  onClick={() => onDownload?.(track)}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-b-lg transition-colors duration-200 flex items-center gap-2"
                  disabled={!currentTrack}
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Track Information */}
        {currentTrack && (
          <div className="border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {track.genre && (
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-white/50 mb-1">Genre</div>
                  <div className="text-white/80 font-medium">{track.genre}</div>
                </div>
              )}
              
              {track.year && (
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-white/50 mb-1">Year</div>
                  <div className="text-white/80 font-medium">{track.year}</div>
                </div>
              )}
              
              {track.bitrate && (
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-white/50 mb-1">Quality</div>
                  <div className="text-white/80 font-medium">{formatBitrate(track.bitrate)}</div>
                </div>
              )}
              
              {track.fileSize && (
                <div className="backdrop-blur-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-white/50 mb-1">Size</div>
                  <div className="text-white/80 font-medium">{formatFileSize(track.fileSize)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Track Selected State */}
        {!currentTrack && (
          <div className="text-center py-8 border-t border-white/10">
            <Music className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              Upload or select a track to see detailed information
            </p>
          </div>
        )}
      </div>

      {/* Ambient Light Effect */}
      {currentTrack && (
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-blue-500/30 rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default TrackInfo;