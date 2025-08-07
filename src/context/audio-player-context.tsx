
'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface AudioPlayerContextType {
  playAudio: (audioSrc: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((audioSrc: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = audioSrc;
    audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ playAudio }}>
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
