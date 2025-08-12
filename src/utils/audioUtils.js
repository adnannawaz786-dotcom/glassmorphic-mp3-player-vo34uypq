// Audio processing and analysis utilities for the glassmorphic MP3 player

export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.source = null;
    this.isInitialized = false;
    this.gainNode = null;
  }

  async initialize(audioElement) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.source) {
        this.source = this.audioContext.createMediaElementSource(audioElement);
        this.analyser = this.audioContext.createAnalyser();
        this.gainNode = this.audioContext.createGain();

        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        this.source.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }

  getFrequencyData() {
    if (!this.isInitialized || !this.analyser) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    return Array.from(this.dataArray);
  }

  getWaveformData() {
    if (!this.isInitialized || !this.analyser) return null;
    
    const waveformData = new Uint8Array(this.bufferLength);
    this.analyser.getByteTimeDomainData(waveformData);
    return Array.from(waveformData);
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  disconnect() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseAudioMetadata = async (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: audio.duration,
        size: file.size,
        type: file.type,
        url: url
      };
      resolve(metadata);
    });

    audio.addEventListener('error', () => {
      resolve({
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: 0,
        size: file.size,
        type: file.type,
        url: url
      });
    });

    audio.src = url;
  });
};

export const createVisualizerBars = (frequencyData, barCount = 64) => {
  if (!frequencyData || frequencyData.length === 0) {
    return Array(barCount).fill(0);
  }

  const bars = [];
  const dataPerBar = Math.floor(frequencyData.length / barCount);
  
  for (let i = 0; i < barCount; i++) {
    const start = i * dataPerBar;
    const end = start + dataPerBar;
    const slice = frequencyData.slice(start, end);
    const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    bars.push(average / 255); // Normalize to 0-1
  }
  
  return bars;
};

export const createCircularVisualizer = (frequencyData, segments = 32) => {
  if (!frequencyData || frequencyData.length === 0) {
    return Array(segments).fill(0);
  }

  const points = [];
  const dataPerSegment = Math.floor(frequencyData.length / segments);
  
  for (let i = 0; i < segments; i++) {
    const start = i * dataPerSegment;
    const end = start + dataPerSegment;
    const slice = frequencyData.slice(start, end);
    const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    
    const angle = (i / segments) * 2 * Math.PI;
    const intensity = average / 255;
    
    points.push({
      angle,
      intensity,
      x: Math.cos(angle),
      y: Math.sin(angle)
    });
  }
  
  return points;
};

export const detectBeat = (frequencyData, threshold = 0.7) => {
  if (!frequencyData || frequencyData.length === 0) return false;
  
  // Focus on bass frequencies (first 10% of spectrum)
  const bassEnd = Math.floor(frequencyData.length * 0.1);
  const bassData = frequencyData.slice(0, bassEnd);
  const bassAverage = bassData.reduce((sum, value) => sum + value, 0) / bassData.length;
  
  return (bassAverage / 255) > threshold;
};

export const smoothArray = (array, factor = 0.2) => {
  if (!array || array.length === 0) return array;
  
  const smoothed = [...array];
  for (let i = 1; i < smoothed.length - 1; i++) {
    smoothed[i] = smoothed[i] * (1 - factor) + 
                  (smoothed[i - 1] + smoothed[i + 1]) * factor * 0.5;
  }
  return smoothed;
};

export const generateAudioWaveform = async (audioBuffer, samples = 200) => {
  if (!audioBuffer) return Array(samples).fill(0);
  
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const waveform = [];
  
  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;
    
    for (let j = start; j < end && j < channelData.length; j++) {
      sum += Math.abs(channelData[j]);
    }
    
    waveform.push(sum / blockSize);
  }
  
  return waveform;
};

export const applyAudioEffects = (gainNode, effects = {}) => {
  if (!gainNode) return;
  
  const { volume = 1, fade = false, fadeDirection = 'in', fadeDuration = 1000 } = effects;
  
  if (fade) {
    const currentTime = gainNode.context.currentTime;
    const startVolume = fadeDirection === 'in' ? 0 : volume;
    const endVolume = fadeDirection === 'in' ? volume : 0;
    
    gainNode.gain.setValueAtTime(startVolume, currentTime);
    gainNode.gain.linearRampToValueAtTime(endVolume, currentTime + fadeDuration / 1000);
  } else {
    gainNode.gain.value = volume;
  }
};

export const validateAudioFile = (file) => {
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid audio format' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 50MB)' };
  }
  
  return { valid: true };
};