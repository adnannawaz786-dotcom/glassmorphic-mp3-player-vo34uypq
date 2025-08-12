export class VisualizerRenderer {
  constructor(canvas, audioContext) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioContext = audioContext;
    this.analyser = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.animationId = null;
    this.visualizerType = 'bars';
    
    this.setupAnalyser();
    this.setupCanvas();
  }

  setupAnalyser() {
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
    }
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  connectSource(source) {
    if (this.analyser && source) {
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }

  setVisualizerType(type) {
    this.visualizerType = type;
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearCanvas();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    if (!this.analyser) return;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    this.clearCanvas();
    
    switch (this.visualizerType) {
      case 'bars':
        this.drawBars();
        break;
      case 'wave':
        this.drawWave();
        break;
      case 'circular':
        this.drawCircular();
        break;
      case 'particles':
        this.drawParticles();
        break;
      default:
        this.drawBars();
    }
  }

  clearCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  drawBars() {
    const rect = this.canvas.getBoundingClientRect();
    const barWidth = rect.width / this.bufferLength * 2.5;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * rect.height * 0.8;
      
      const gradient = this.ctx.createLinearGradient(0, rect.height, 0, rect.height - barHeight);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.4)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, rect.height - barHeight, barWidth - 1, barHeight);
      
      x += barWidth;
    }
  }

  drawWave() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    this.ctx.beginPath();

    const sliceWidth = rect.width / this.bufferLength;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * rect.height / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(rect.width, rect.height / 2);
    this.ctx.stroke();
  }

  drawCircular() {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    this.ctx.lineWidth = 2;

    for (let i = 0; i < this.bufferLength; i++) {
      const angle = (i / this.bufferLength) * Math.PI * 2;
      const amplitude = (this.dataArray[i] / 255) * 50;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + amplitude);
      const y2 = centerY + Math.sin(angle) * (radius + amplitude);

      const hue = (i / this.bufferLength) * 360;
      this.ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  drawParticles() {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < this.bufferLength; i++) {
      const amplitude = this.dataArray[i] / 255;
      if (amplitude > 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = amplitude * 100;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = amplitude * 5;

        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${amplitude})`);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  resize() {
    this.setupCanvas();
  }

  destroy() {
    this.stop();
    if (this.analyser) {
      this.analyser.disconnect();
    }
  }
}

export const createVisualizerPresets = () => {
  return [
    {
      id: 'bars',
      name: 'Frequency Bars',
      icon: '📊',
      description: 'Classic frequency bars visualization'
    },
    {
      id: 'wave',
      name: 'Waveform',
      icon: '〰️',
      description: 'Smooth waveform display'
    },
    {
      id: 'circular',
      name: 'Circular',
      icon: '⭕',
      description: 'Radial frequency visualization'
    },
    {
      id: 'particles',
      name: 'Particles',
      icon: '✨',
      description: 'Dynamic particle effects'
    }
  ];
};

export const getVisualizerColors = (type) => {
  const colorSchemes = {
    bars: {
      primary: 'rgba(139, 92, 246, 0.8)',
      secondary: 'rgba(59, 130, 246, 0.6)',
      accent: 'rgba(16, 185, 129, 0.4)'
    },
    wave: {
      primary: 'rgba(139, 92, 246, 0.8)',
      secondary: 'rgba(168, 85, 247, 0.6)',
      accent: 'rgba(217, 70, 239, 0.4)'
    },
    circular: {
      primary: 'rgba(59, 130, 246, 0.8)',
      secondary: 'rgba(16, 185, 129, 0.6)',
      accent: 'rgba(245, 158, 11, 0.4)'
    },
    particles: {
      primary: 'rgba(139, 92, 246, 0.9)',
      secondary: 'rgba(59, 130, 246, 0.7)',
      accent: 'rgba(16, 185, 129, 0.5)'
    }
  };

  return colorSchemes[type] || colorSchemes.bars;
};