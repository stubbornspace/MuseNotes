import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

interface AudioContextType {
  isPlaying: boolean;
  currentTrack: string | null;
  togglePlayback: (trackName?: string) => Promise<void>;
  availableTracks: { name: string; file: any }[];
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  const availableTracks = [
    { name: 'Stars', file: require('../../assets/audio/stars.m4a') },
    { name: 'Space', file: require('../../assets/audio/space.m4a') },
    { name: 'Galaxy', file: require('../../assets/audio/galaxy.m4a') },
    { name: 'Destiny', file: require('../../assets/audio/destiny.m4a') },
  ];

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const togglePlayback = async (trackName?: string) => {
    try {
      // If a specific track is selected
      if (trackName) {
        // If the same track is selected and is playing, stop it
        if (currentTrack === trackName && isPlaying) {
          await sound?.pauseAsync();
          setIsPlaying(false);
          return;
        }
        
        // If a different track is selected, stop current track and load new one
        if (sound) {
          await sound.unloadAsync();
        }

        const selectedTrack = availableTracks.find(track => track.name === trackName);
        if (selectedTrack) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            selectedTrack.file,
            { shouldPlay: true }
          );
          setSound(newSound);
          setCurrentTrack(trackName);
          setIsPlaying(true);
        }
      } else {
        // If no track specified, toggle current track
        if (sound) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling audio playback:', error);
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, currentTrack, togglePlayback, availableTracks }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 