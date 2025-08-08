
'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode, useState, useEffect } from 'react';

interface AudioPlayerContextType {
  initAudio: () => void;
  playAudio: (audioSrc: string, onEnded?: () => void) => void;
  playStartSound: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const onEndedCallbackRef = useRef<(() => void) | null>(null);
  const isInitialized = useRef(false);

  // Initialize AudioContext on first user interaction
  const initAudio = useCallback(() => {
    if (isInitialized.current || typeof window === 'undefined') return;
    isInitialized.current = true;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContext();
        audioContextRef.current = context;

        if (context.state === 'suspended') {
            context.resume();
        }
    } catch (e) {
        console.error("Could not create AudioContext:", e);
    }
  }, []);


  const playStartSound = useCallback(() => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const handleAudioEnded = useCallback(() => {
      setIsPlaying(false);
      if(onEndedCallbackRef.current) {
          onEndedCallbackRef.current();
          onEndedCallbackRef.current = null; // Clear callback after execution
      }
  }, []);

  // Effect to set up the audio element and its event listeners once
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener('ended', handleAudioEnded);
    }
    return () => {
        if (audioRef.current) {
            audioRef.current.removeEventListener('ended', handleAudioEnded);
        }
    }
  }, [handleAudioEnded]);


  const playAudio = useCallback((audioSrc: string, onEnded?: () => void) => {
    if (!audioRef.current) return;
    
    onEndedCallbackRef.current = onEnded || null;

    audioRef.current.src = audioSrc;
    const playPromise = audioRef.current.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            setIsPlaying(true);
        }).catch(error => {
            console.error("Audio playback failed:", error);
            setIsPlaying(false);
            handleAudioEnded();
        });
    }
  }, [handleAudioEnded]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      handleAudioEnded();
    }
  }, [handleAudioEnded]);


  return (
    <AudioPlayerContext.Provider value={{ initAudio, playAudio, playStartSound, stopAudio, isPlaying }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
