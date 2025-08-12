import React, { useState, useRef, useCallback } from 'react';
import { Upload, Music, X, FileMusic, AlertCircle } from 'lucide-react';

const FileUploader = ({ onFilesUploaded, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(mp3|mpeg|wav|ogg|m4a)$/)) {
      return 'Please upload valid audio files (MP3, WAV, OGG, M4A)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
  };

  const processFiles = useCallback(async (files) => {
    setIsUploading(true);
    setError('');
    
    const validFiles = [];
    const errors = [];

    for (let file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        const audioUrl = URL.createObjectURL(file);
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          url: audioUrl,
          duration: null
        });
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      // Get audio duration for each file
      const filesWithDuration = await Promise.all(
        validFiles.map(async (fileData) => {
          try {
            const audio = new Audio(fileData.url);
            await new Promise((resolve, reject) => {
              audio.addEventListener('loadedmetadata', () => {
                fileData.duration = audio.duration;
                resolve();
              });
              audio.addEventListener('error', reject);
            });
          } catch (err) {
            console.warn('Could not load metadata for:', fileData.name);
          }
          return fileData;
        })
      );

      setUploadedFiles(prev => [...prev, ...filesWithDuration]);
      onFilesUploaded?.(filesWithDuration);
    }

    setIsUploading(false);
  }, [onFilesUploaded]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          backdrop-blur-md bg-white/10 border-white/20
          ${isDragOver 
            ? 'border-purple-400/60 bg-purple-500/20 scale-[1.02]' 
            : 'hover:border-white/40 hover:bg-white/15'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.m4a"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 
            border border-white/20 transition-transform duration-300
            ${isDragOver ? 'scale-110' : ''}
          `}>
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-white/80" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {isUploading ? 'Processing files...' : 'Drop your music here'}
            </h3>
            <p className="text-white/60 text-sm">
              or click to browse • MP3, WAV, OGG, M4A files supported
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-white/80 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <FileMusic className="w-4 h-4 text-white/80" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-white/60">
                    {formatFileSize(file.size)} • {formatDuration(file.duration)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="p-1 rounded-full hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;