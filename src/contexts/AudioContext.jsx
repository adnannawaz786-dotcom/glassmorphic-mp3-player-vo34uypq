import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';

const AudioContext = createContext();

const initialState = {
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isLoading: false,
  isShuffled: false,
  repeatMode: 'off', // 'off', 'one', 'all'
  currentIndex: 0,
  visualizerData: new Uint8Array(128),
  error: null
};

const audioReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        currentIndex: state.playlist.findIndex(track => track.id === action.payload.id),
        error: null
      };
    
    case 'SET_PLAYLIST':
      return {
        ...state,
        playlist: action.payload,
        currentIndex: action.payload.length > 0 ? 0 : -1
      };
    
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
        isPaused: false,
        error: null
      };
    
    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
        isPaused: true
      };
    
    case 'STOP':
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        currentTime: 0
      };
    
    case 'SET_TIME':
      return {
        ...state,
        currentTime: action.payload
      };
    
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload
      };
    
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload,
        isMuted: action.payload === 0
      };
    
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        isShuffled: !state.isShuffled
      };
    
    case 'SET_REPEAT_MODE':
      const modes = ['off', 'one', 'all'];
      const currentModeIndex = modes.indexOf(state.repeatMode);
      const nextMode = modes[(currentModeIndex + 1) % modes.length];
      return {
        ...state,
        repeatMode: nextMode
      };
    
    case 'NEXT_TRACK':
      if (state.playlist.length === 0) return state;
      let nextIndex;
      if (state.isShuffled) {
        nextIndex = Math.floor(Math.random() * state.playlist.length);
      } else {
        nextIndex = (state.currentIndex + 1) % state.playlist.length;
      }
      return {
        ...state,
        currentIndex: nextIndex,
        currentTrack: state.playlist[nextIndex],
        currentTime: 0
      };
    
    case 'PREVIOUS_TRACK':
      if (state.playlist.length === 0) return state;
      const prevIndex = state.currentIndex === 0 
        ? state.playlist.length - 1 
        : state.currentIndex - 1;
      return {
        ...state,
        currentIndex: prevIndex,
        currentTrack: state.playlist[prevIndex],
        currentTime: 0
      };
    
    case 'SET_VISUALIZER_DATA':
      return {
        ...state,
        visualizerData: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    default:
      return state;
  }
};

export const AudioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
    
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_TIME', payload: audio.currentTime });
    };

    const handleLoadedMetadata = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    const handleEnded = () => {
      if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (state.repeatMode === 'all' || state.currentIndex < state.playlist.length - 1) {
        dispatch({ type: 'NEXT_TRACK' });
      } else {
        dispatch({ type: 'STOP' });
      }
    };

    const handleError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio file' });
    };

    const handleLoadStart = () => {
      dispatch({ type: 'SET_LOADING', payload: true });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.pause();
    };
  }, [state.repeatMode, state.currentIndex, state.playlist.length]);

  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 256;
    }
  };

  const updateVisualizerData = () => {
    if (analyserRef.current && state.isPlaying) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      dispatch({ type: 'SET_VISUALIZER_DATA', payload: dataArray });
    }
    requestAnimationFrame(updateVisualizerData);
  };

  useEffect(() => {
    if (state.isPlaying) {
      initializeAudioContext();
      updateVisualizerData();
    }
  }, [state.isPlaying]);

  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      audioRef.current.src = state.currentTrack.url;
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  }, [state.currentTrack, state.volume, state.isMuted]);

  const value = {
    ...state,
    audioRef,
    dispatch
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};