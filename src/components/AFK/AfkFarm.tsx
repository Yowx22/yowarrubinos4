import { useState, useEffect } from 'react';
import { useCoins } from '@/hooks/useCoins';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MusicDialog } from './MusicDialog';

const AfkFarm = () => {
  const { coins, addCoins } = useCoins();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [timePassed, setTimePassed] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [limitReached, setLimitReached] = useState(false);
  const [showMusicDialog, setShowMusicDialog] = useState(false);
  
  // Constants
  const COIN_RATE = 0.1; // 0.1 coins per minute
  const COIN_INTERVAL = 60; // 1 minute in seconds
  const MAX_DAILY_COINS = 20;
  const MUSIC_PROMPT_INTERVAL = 5 * 60; // 5 minutes in seconds
  
  // Load AFK state from localStorage on component mount
  useEffect(() => {
    if (!user) return;
    
    const storedAfkData = localStorage.getItem(`afk_farm_${user.id}`);
    if (storedAfkData) {
      const { startTime, earnedToday, lastReset } = JSON.parse(storedAfkData);
      
      // Check if we need to reset the daily limit
      const now = new Date();
      const lastResetDate = new Date(lastReset);
      if (now.toDateString() !== lastResetDate.toDateString()) {
        // New day, reset the limit
        setCoinsEarned(0);
        saveAfkState(0);
      } else {
        // Same day, restore earned amount
        setCoinsEarned(earnedToday);
        
        if (earnedToday >= MAX_DAILY_COINS) {
          setLimitReached(true);
        }
      }
    }
  }, [user]);
  
  // Timer effect for AFK farming
  useEffect(() => {
    if (!isActive || !user) return;
    
    const interval = setInterval(() => {
      setTimePassed(prev => {
        const newTime = prev + 1;
        
        // Show music dialog every MUSIC_PROMPT_INTERVAL seconds
        if (newTime % MUSIC_PROMPT_INTERVAL === 0) {
          setShowMusicDialog(true);
        }
        
        // Give coins every COIN_INTERVAL seconds
        if (newTime > 0 && newTime % COIN_INTERVAL === 0) {
          const newEarned = coinsEarned + COIN_RATE;
          setCoinsEarned(newEarned);
          saveAfkState(newEarned);
          
          // Add coins to balance
          addCoins(COIN_RATE, 'AFK Farm');
          
          // Check if limit reached
          if (newEarned >= MAX_DAILY_COINS) {
            setLimitReached(true);
            setIsActive(false);
            toast({
              title: "Daily limit reached",
              description: "You've reached the daily limit of 20 coins from AFK farming",
            });
          }
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, timePassed, coinsEarned, user]);
  
  const saveAfkState = (earnedAmount: number) => {
    if (!user) return;
    
    const afkData = {
      startTime: new Date().toISOString(),
      earnedToday: earnedAmount,
      lastReset: new Date().toISOString(),
    };
    
    localStorage.setItem(`afk_farm_${user.id}`, JSON.stringify(afkData));
  };
  
  const toggleFarming = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to use the AFK farm",
        variant: "destructive",
      });
      return;
    }
    
    if (limitReached) {
      toast({
        title: "Limit reached",
        description: "You've reached the daily limit for AFK farming",
        variant: "destructive",
      });
      return;
    }
    
    setIsActive(!isActive);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining coins
  const remainingCoins = MAX_DAILY_COINS - coinsEarned;
  
  if (!user) {
    return (
      <div className="p-6 bg-spdm-gray rounded-lg text-center">
        <h2 className="text-xl font-semibold text-spdm-green mb-3">AFK Farm</h2>
        <p className="text-gray-400">Please login to use the AFK Farm feature.</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-6 bg-spdm-gray rounded-lg border border-spdm-green/20">
        <h2 className="text-xl font-semibold text-spdm-green text-center mb-6">AFK Farm</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className={`p-6 rounded-lg border ${isActive ? 'bg-green-900/20 border-green-500/30 glow-border' : 'bg-spdm-dark border-spdm-green/20'} flex flex-col items-center transition-all duration-300`}>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  {isActive ? 'Currently Farming' : 'Start AFK Farming'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isActive 
                    ? 'Leave this page open to continue farming'
                    : 'Start farming to earn 0.1 coins per minute'
                  }
                </p>
              </div>
              
              {isActive && (
                <div className="w-24 h-24 rounded-full border-4 border-spdm-green flex items-center justify-center mb-6 animate-pulse">
                  <span className="text-2xl font-bold text-spdm-green">{formatTime(timePassed)}</span>
                </div>
              )}
              
              <Button 
                onClick={toggleFarming}
                className={`w-full ${
                  limitReached
                    ? 'bg-gray-700 cursor-not-allowed text-gray-300'
                    : isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-spdm-green hover:bg-spdm-darkGreen text-black'
                }`}
                disabled={limitReached}
              >
                {limitReached 
                  ? 'Daily Limit Reached' 
                  : isActive 
                    ? 'Stop Farming' 
                    : 'Start Farming'
                }
              </Button>
            </div>
          </div>
          
          <div>
            <div className="bg-spdm-dark p-6 rounded-lg border border-spdm-green/20">
              <h3 className="text-lg font-medium text-white mb-4">Your Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Earned today</p>
                  <div className="bg-spdm-black/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white">{coinsEarned.toFixed(1)} / {MAX_DAILY_COINS} coins</span>
                      <span className="text-xs text-gray-500">{((coinsEarned / MAX_DAILY_COINS) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-spdm-green h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(coinsEarned / MAX_DAILY_COINS) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Rate</p>
                  <div className="bg-spdm-black/50 rounded-lg p-3">
                    <span className="text-white">{COIN_RATE} coins per minute</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Time to limit</p>
                  <div className="bg-spdm-black/50 rounded-lg p-3">
                    <span className="text-white">
                      {limitReached 
                        ? 'Limit reached'
                        : `${Math.ceil(remainingCoins / COIN_RATE)} minutes remaining`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {limitReached && (
              <div className="mt-4 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-center">
                <p className="text-yellow-300 font-medium">Daily limit reached</p>
                <p className="text-sm text-gray-300 mt-1">
                  Come back tomorrow to farm more coins!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MusicDialog 
        open={showMusicDialog} 
        onOpenChange={setShowMusicDialog} 
      />
    </>
  );
};

export default AfkFarm;