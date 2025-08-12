import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioContext = (audioElement) => {
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [dataArray, setDataArray] = useState(null);
  const [source, setSource] = useState(null);
  const [isContextReady, setIsContextReady] = useState(false);
  const [error, setError] = useState(null);
  
  const contextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);
  const bassBoostRef = useRef(null);
  const midBoostRef = useRef(null);
  const trebleBoostRef = useRef(null);

  const initializeContext = useCallback(async () => {
    if (!audioElement || contextRef.current) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      
      if (!AudioContext) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      const ctx = new AudioContext();
      contextRef.current = ctx;

      // Resume context if suspended (required for some browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create audio source
      const audioSource = ctx.createMediaElementSource(audioElement);
      sourceRef.current = audioSource;

      // Create analyser node
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0.8;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -10;
      analyserRef.current = analyserNode;

      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1;
      gainNodeRef.current = gainNode;

      // Create compressor for dynamic range
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // Create EQ filters
      const bassBoost = ctx.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 320;
      bassBoost.gain.value = 0;
      bassBoostRef.current = bassBoost;

      const midBoost = ctx.createBiquadFilter();
      midBoost.type = 'peaking';
      midBoost.frequency.value = 1000;
      midBoost.Q.value = 0.5;
      midBoost.gain.value = 0;
      midBoostRef.current = midBoost;

      const trebleBoost = ctx.createBiquadFilter();
      trebleBoost.type = 'highshelf';
      trebleBoost.frequency.value = 3200;
      trebleBoost.gain.value = 0;
      trebleBoostRef.current = trebleBoost;

      // Connect the audio graph
      audioSource
        .connect(bassBoost)
        .connect(midBoost)
        .connect(trebleBoost)
        .connect(compressor)
        .connect(gainNode)
        .connect(analyserNode)
        .connect(ctx.destination);

      // Create data array for frequency analysis
      const bufferLength = analyserNode.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);

      setAudioContext(ctx);
      setAnalyser(analyserNode);
      setDataArray(frequencyData);
      setSource(audioSource);
      setIsContextReady(true);
      setError(null);

    } catch (err) {
      console.error('Failed to initialize audio context:', err);
      setError(err.message);
      setIsContextReady(false);
    }
  }, [audioElement]);

  const resumeContext = useCallback(async () => {
    if (contextRef.current && contextRef.current.state === 'suspended') {
      try {
        await contextRef.current.resume();
      } catch (err) {
        console.error('Failed to resume audio context:', err);
      }
    }
  }, []);

  const setVolume = useCallback((volume) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, contextRef.current.currentTime);
    }
  }, []);

  const setEQ = useCallback((bass, mid, treble) => {
    if (bassBoostRef.current) {
      bassBoostRef.current.gain.setValueAtTime(bass, contextRef.current.currentTime);
    }
    if (midBoostRef.current) {
      midBoostRef.current.gain.setValueAtTime(mid, contextRef.current.currentTime);
    }
    if (trebleBoostRef.current) {
      trebleBoostRef.current.gain.setValueAtTime(treble, contextRef.current.currentTime);
    }
  }, []);

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && dataArray) {
      analyserRef.current.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return null;
  }, [dataArray]);

  const getTimeDomainData = useCallback(() => {
    if (analyserRef.current && dataArray) {
      const timeDomainData = new Uint8Array(analyserRef.current.fftSize);
      analyserRef.current.getByteTimeDomainData(timeDomainData);
      return timeDomainData;
    }
    return null;
  }, [dataArray]);

  const cleanup = useCallback(() => {
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    sourceRef.current = null;
    analyserRef.current = null;
    gainNodeRef.current = null;
    compressorRef.current = null;
    bassBoostRef.current = null;
    midBoostRef.current = null;
    trebleBoostRef.current = null;
    
    setAudioContext(null);
    setAnalyser(null);
    setDataArray(null);
    setSource(null);
    setIsContextReady(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (audioElement) {
      initializeContext();
    }

    return () => {
      cleanup();
    };
  }, [audioElement, initializeContext, cleanup]);

  // Handle visibility change to prevent audio context suspension
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && contextRef.current?.state === 'suspended') {
        resumeContext();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resumeContext]);

  return {
    audioContext,
    analyser,
    dataArray,
    source,
    isContextReady,
    error,
    resumeContext,
    setVolume,
    setEQ,
    getFrequencyData,
    getTimeDomainData,
    cleanup,
    initializeContext
  };
};

export default useAudioContext;