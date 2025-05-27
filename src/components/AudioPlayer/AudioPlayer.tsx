import { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, List } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

interface Song {
  url: string;
  name: string;
  artist?: string;
}

const SONGS: Song[] = [
  {
    url: 'https://audio.jukehost.co.uk/B6d6uv9pNK9TYwdLXuw7BieLMYCifaGa',
    name: 'Dark',
  },
  {
    url: 'https://audio.jukehost.co.uk/oTERxIhIQjmgKJdQa14r5sysOxDgihQ4',
    name: 'FOD',
  },
  {
    url: 'https://audio.jukehost.co.uk/w3MZYahiycAlNMDYCvvwt2wIlT88dbup',
    name: 'Niga',
  },
  {
    url: 'https://audio.jukehost.co.uk/0CY07C5V1K9RP6Y0rSBtqpH1OOQ7o3Ip',
    name: 'Ponk',
  },
  {
    url: 'https://audio.jukehost.co.uk/6b6VGT0o3A1tkA0dKJEgcBjSvkQBrmPX',
    name: 'Ponk 2',
  },
  {
    url: 'https://audio.jukehost.co.uk/2y5XmEUzV6GE5BKFnTEWzSKzJReHwYwz',
    name: 'Rap',
  },
  {
    url: 'https://audio.jukehost.co.uk/xKwFtvNv93rtoHMFDvKHTfaoTE9NQmbv',
    name: 'Sad',
  }
];

export const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showControls, setShowControls] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = SONGS[currentSongIndex];

  // Initialize audio element
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const audio = new Audio();
    
    // Add event listeners for error handling
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setError('Failed to load audio. Please try again.');
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    // Configure audio
    audio.src = currentSong.url;
    audio.loop = false;
    audio.volume = volume / 100;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Don't autoplay - wait for user interaction
    setIsPlaying(false);
    
    // Add event listener for when song ends
    const handleEnded = () => handleNextSong();
    audio.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [currentSongIndex]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio. Please try again.');
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };
  
  const handlePreviousSong = () => {
    const newIndex = currentSongIndex <= 0 ? SONGS.length - 1 : currentSongIndex - 1;
    changeSong(newIndex);
  };
  
  const handleNextSong = () => {
    const newIndex = (currentSongIndex + 1) % SONGS.length;
    changeSong(newIndex);
  };
  
  const changeSong = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentSongIndex(index);
      setIsPlaying(false);
    }
  };
  
  const selectSong = (index: number) => {
    changeSong(index);
    setShowPlaylist(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Audio Control Button */}
      <motion.div
        className="bg-spdm-dark border border-spdm-green/40 rounded-full p-3 shadow-lg cursor-pointer hover:bg-spdm-gray transition-colors flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowControls(!showControls)}
      >
        <Music className="w-5 h-5 text-spdm-green" />
      </motion.div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 10, width: 0 }}
            animate={{ opacity: 1, y: 0, width: 'auto' }}
            exit={{ opacity: 0, y: 10, width: 0 }}
            className="absolute bottom-full right-0 mb-3 bg-spdm-dark border border-spdm-green/30 rounded-lg p-4 shadow-xl"
            style={{ minWidth: '280px' }}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-spdm-green flex items-center">
                  <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="hover:bg-spdm-green/20 p-1.5 rounded-full transition-colors mr-2"
                  >
                    <List className="w-4 h-4 text-spdm-green" />
                  </button>
                  
                  {/* Song Title with Animation */}
                  <div className="overflow-hidden w-40">
                    <motion.div className="flex flex-col">
                      <motion.span 
                        key={`title-${currentSongIndex}`}
                        className="inline-block font-medium"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentSong.name}
                      </motion.span>
                      
                      {currentSong.artist && (
                        <motion.span 
                          key={`artist-${currentSongIndex}`}
                          className="text-xs text-gray-400"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          {currentSong.artist}
                        </motion.span>
                      )}
                    </motion.div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="hover:bg-spdm-green/20 p-1.5 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  {isPlaying ? (
                    <VolumeX className="w-4 h-4 text-spdm-green" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-spdm-green" />
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-400 text-xs text-center bg-red-400/10 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="text-spdm-green text-xs text-center">
                  Loading audio...
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Volume</span>
                  <span>{volume}%</span>
                </div>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-center space-x-4 pt-1">
                <button 
                  onClick={handlePreviousSong}
                  className="p-2 hover:bg-spdm-green/20 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <SkipBack className="w-4 h-4 text-spdm-green" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="p-2 bg-spdm-green/20 hover:bg-spdm-green/30 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-spdm-green" />
                  ) : (
                    <Play className="w-5 h-5 text-spdm-green" />
                  )}
                </button>
                <button 
                  onClick={handleNextSong}
                  className="p-2 hover:bg-spdm-green/20 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <SkipForward className="w-4 h-4 text-spdm-green" />
                </button>
              </div>
              
              {/* Playlist */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-spdm-gray/50 rounded-md p-1 mt-1">
                      {SONGS.map((song, index) => (
                        <div
                          key={index}
                          onClick={() => selectSong(index)}
                          className={`p-2 rounded cursor-pointer flex items-center gap-2 text-sm ${
                            currentSongIndex === index
                              ? 'bg-spdm-green/20 text-spdm-green'
                              : 'hover:bg-spdm-green/10 text-gray-300'
                          }`}
                        >
                          {currentSongIndex === index && isPlaying ? (
                            <div className="w-2 h-2 rounded-full bg-spdm-green animate-pulse"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-gray-500"></div>
                          )}
                          <div className="truncate">
                            <div className="font-medium">{song.name}</div>
                            {song.artist && (
                              <div className="text-xs text-gray-400">{song.artist}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioPlayer;