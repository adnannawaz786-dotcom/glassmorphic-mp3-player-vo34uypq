import React, { useRef, useEffect, useState } from 'react';

const AudioVisualizer = ({ audioRef, isPlaying, visualizerMode = 'bars' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!audioRef?.current || isInitialized) return;

    const initializeAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        setIsInitialized(true);
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
      }
    };

    const handleCanPlay = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (!isInitialized) {
        initializeAudio();
      }
    };

    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('play', handleCanPlay);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('play', handleCanPlay);
      }
    };
  }, [audioRef, isInitialized]);

  const drawBars = (ctx, canvas, dataArray) => {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const barWidth = width / dataArray.length * 2.5;
    let barHeight;
    let x = 0;

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = (dataArray[i] / 255) * height * 0.8;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;
      
      x += barWidth + 2;
    }
  };

  const drawWave = (ctx, canvas, dataArray) => {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const sliceWidth = width / dataArray.length;
    let x = 0;

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
    ctx.shadowBlur = 15;

    ctx.beginPath();

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawCircle = (ctx, canvas, dataArray) => {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.6)');
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.4)');

    for (let i = 0; i < dataArray.length; i++) {
      const angle = (i / dataArray.length) * Math.PI * 2;
      const barHeight = (dataArray[i] / 255) * radius;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const animate = () => {
    if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (isPlaying) {
      switch (visualizerMode) {
        case 'bars':
          drawBars(ctx, canvas, dataArrayRef.current);
          break;
        case 'wave':
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
          drawWave(ctx, canvas, dataArrayRef.current);
          break;
        case 'circle':
          drawCircle(ctx, canvas, dataArrayRef.current);
          break;
        default:
          drawBars(ctx, canvas, dataArrayRef.current);
      }
    } else {
      const staticData = new Uint8Array(dataArrayRef.current.length);
      staticData.fill(20);
      drawBars(ctx, canvas, staticData);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isInitialized) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, isPlaying, visualizerMode]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 backdrop-blur-sm"
        style={{ filter: 'blur(0px)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};

export default AudioVisualizer;