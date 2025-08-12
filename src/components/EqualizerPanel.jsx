import React, { useState, useEffect, useRef } from 'react';

const EqualizerPanel = ({ audioElement, isVisible, onToggle }) => {
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [gainNodes, setGainNodes] = useState([]);
  const [frequencies] = useState([60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000]);
  const [gains, setGains] = useState(new Array(10).fill(0));
  const [isEnabled, setIsEnabled] = useState(false);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]);

  useEffect(() => {
    if (audioElement && !audioContext) {
      initializeAudioContext();
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioElement]);

  const initializeAudioContext = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;

      if (!sourceRef.current && audioElement) {
        sourceRef.current = context.createMediaElementSource(audioElement);
      }

      const filters = frequencies.map((freq, index) => {
        const filter = context.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      filtersRef.current = filters;

      if (sourceRef.current) {
        let previousNode = sourceRef.current;
        
        filters.forEach((filter) => {
          previousNode.connect(filter);
          previousNode = filter;
        });

        previousNode.connect(analyserNode);
        analyserNode.connect(context.destination);
      }

      setAudioContext(context);
      setAnalyser(analyserNode);
      setGainNodes(filters);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  };

  const handleGainChange = (index, value) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);

    if (filtersRef.current[index] && isEnabled) {
      filtersRef.current[index].gain.value = value;
    }
  };

  const toggleEqualizer = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);

    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = newEnabled ? gains[index] : 0;
      });
    }
  };

  const resetEqualizer = () => {
    const resetGains = new Array(10).fill(0);
    setGains(resetGains);

    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter) => {
        filter.gain.value = 0;
      });
    }
  };

  const applyPreset = (preset) => {
    let presetGains;
    
    switch (preset) {
      case 'rock':
        presetGains = [5, 3, -2, -3, -1, 2, 5, 6, 6, 6];
        break;
      case 'pop':
        presetGains = [-1, 2, 4, 4, 0, -1, -1, -1, 2, 3];
        break;
      case 'jazz':
        presetGains = [4, 3, 1, 2, -1, -1, 0, 1, 3, 4];
        break;
      case 'classical':
        presetGains = [4, 3, 2, 1, -1, -1, 0, 2, 3, 4];
        break;
      case 'electronic':
        presetGains = [4, 3, 1, 0, -2, 1, 0, 1, 4, 5];
        break;
      default:
        presetGains = new Array(10).fill(0);
    }

    setGains(presetGains);
    
    if (isEnabled && filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = presetGains[index];
      });
    }
  };

  const formatFrequency = (freq) => {
    return freq >= 1000 ? `${(freq / 1000).toFixed(0)}k` : `${freq}`;
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl z-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Equalizer</h3>
          <button
            onClick={toggleEqualizer}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isEnabled
                ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-3 mb-6 justify-center">
        {frequencies.map((freq, index) => (
          <div key={freq} className="flex flex-col items-center">
            <div className="h-32 w-8 bg-gray-800/50 rounded-lg relative mb-2 border border-white/10">
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={gains[index]}
                onChange={(e) => handleGainChange(index, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                disabled={!isEnabled}
              />
              <div 
                className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-200 ${
                  isEnabled ? 'bg-gradient-to-t from-blue-500 to-purple-500' : 'bg-gray-600'
                }`}
                style={{ 
                  height: `${((gains[index] + 12) / 24) * 100}%`,
                  minHeight: '2px'
                }}
              />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 transform -translate-y-1/2" />
            </div>
            <span className="text-xs text-white/70 font-mono">
              {formatFrequency(freq)}Hz
            </span>
            <span className="text-xs text-white/50 font-mono mt-1">
              {gains[index] > 0 ? '+' : ''}{gains[index].toFixed(1)}dB
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => applyPreset('rock')}
          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-400/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors duration-200"
        >
          Rock
        </button>
        <button
          onClick={() => applyPreset('pop')}
          className="px-3 py-1.5 bg-pink-500/20 text-pink-400 border border-pink-400/30 rounded-lg text-sm hover:bg-pink-500/30 transition-colors duration-200"
        >
          Pop
        </button>
        <button
          onClick={() => applyPreset('jazz')}
          className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors duration-200"
        >
          Jazz
        </button>
        <button
          onClick={() => applyPreset('classical')}
          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-400/30 rounded-lg text-sm hover:bg-purple-500/30 transition-colors duration-200"
        >
          Classical
        </button>
        <button
          onClick={() => applyPreset('electronic')}
          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors duration-200"
        >
          Electronic
        </button>
        <button
          onClick={resetEqualizer}
          className="px-3 py-1.5 bg-gray-500/20 text-gray-400 border border-gray-400/30 rounded-lg text-sm hover:bg-gray-500/30 transition-colors duration-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default EqualizerPanel;