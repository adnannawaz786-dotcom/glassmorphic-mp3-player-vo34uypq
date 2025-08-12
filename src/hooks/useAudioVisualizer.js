import { useState, useEffect, useRef, useCallback } from 'react';

const useAudioVisualizer = (audioElement, isPlaying) => {
  const [analyserData, setAnalyserData] = useState(new Uint8Array(128));
  const [isVisualizerActive, setIsVisualizerActive] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(128));

  // Initialize audio context and analyser
  const initializeAnalyser = useCallback(async () => {
    if (!audioElement || audioContextRef.current) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      
      // Connect nodes
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Initialize data array
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      setIsVisualizerActive(true);
    } catch (error) {
      console.error('Error initializing audio analyser:', error);
    }
  }, [audioElement]);

  // Resume audio context if suspended
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Error resuming audio context:', error);
      }
    }
  }, []);

  // Get frequency data
  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return dataArrayRef.current;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  // Get time domain data for waveform
  const getTimeDomainData = useCallback(() => {
    if (!analyserRef.current) return dataArrayRef.current;
    
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  // Animation loop for visualizer
  const animate = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return;

    const frequencyData = getFrequencyData();
    setAnalyserData(new Uint8Array(frequencyData));
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, getFrequencyData]);

  // Get average volume level
  const getAverageVolume = useCallback(() => {
    const data = getFrequencyData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }, [getFrequencyData]);

  // Get bass level (low frequencies)
  const getBassLevel = useCallback(() => {
    const data = getFrequencyData();
    let sum = 0;
    const bassRange = Math.floor(data.length * 0.1); // First 10% of frequencies
    for (let i = 0; i < bassRange; i++) {
      sum += data[i];
    }
    return sum / bassRange / 255;
  }, [getFrequencyData]);

  // Get treble level (high frequencies)
  const getTrebleLevel = useCallback(() => {
    const data = getFrequencyData();
    let sum = 0;
    const trebleStart = Math.floor(data.length * 0.7); // Last 30% of frequencies
    for (let i = trebleStart; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length - trebleStart) / 255;
  }, [getFrequencyData]);

  // Get dominant frequency
  const getDominantFrequency = useCallback(() => {
    const data = getFrequencyData();
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxValue) {
        maxValue = data[i];
        maxIndex = i;
      }
    }
    
    const nyquist = audioContextRef.current?.sampleRate / 2 || 22050;
    return (maxIndex / data.length) * nyquist;
  }, [getFrequencyData]);

  // Get spectrum peaks for visualization
  const getSpectrumPeaks = useCallback((numBands = 32) => {
    const data = getFrequencyData();
    const peaks = [];
    const bandSize = Math.floor(data.length / numBands);
    
    for (let i = 0; i < numBands; i++) {
      let max = 0;
      const start = i * bandSize;
      const end = Math.min(start + bandSize, data.length);
      
      for (let j = start; j < end; j++) {
        max = Math.max(max, data[j]);
      }
      
      peaks.push(max / 255);
    }
    
    return peaks;
  }, [getFrequencyData]);

  // Start visualization
  const startVisualization = useCallback(() => {
    if (!isVisualizerActive) return;
    
    resumeAudioContext();
    animate();
  }, [isVisualizerActive, resumeAudioContext, animate]);

  // Stop visualization
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Initialize when audio element is available
  useEffect(() => {
    if (audioElement) {
      initializeAnalyser();
    }
  }, [audioElement, initializeAnalyser]);

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      startVisualization();
    } else {
      stopVisualization();
    }
  }, [isPlaying, startVisualization, stopVisualization]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopVisualization]);

  return {
    analyserData,
    isVisualizerActive,
    getFrequencyData,
    getTimeDomainData,
    getAverageVolume,
    getBassLevel,
    getTrebleLevel,
    getDominantFrequency,
    getSpectrumPeaks,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current
  };
};

export default useAudioVisualizer;