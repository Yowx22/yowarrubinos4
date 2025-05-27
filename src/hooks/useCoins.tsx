
import { useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface UseCoinsProps {
  dailyLimit?: number;
}

export function useCoins({ dailyLimit = 15 }: UseCoinsProps = {}) {
  const { user, updateUserCoins } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Function to add coins to user's balance
  const addCoins = async (amount: number, source: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to earn coins",
        variant: "destructive",
      });
      return false;
    }
    
    // If amount is 0, this is just a balance refresh request
    if (amount === 0 && source === "refresh") {
      try {
        await updateUserCoins(0);
        return true;
      } catch (error) {
        console.error("Error refreshing coins balance:", error);
        return false;
      }
    }
    
    setLoading(true);
    
    try {
      // Convert to integer
      const intAmount = Math.round(amount);
      
      if (intAmount <= 0) {
        toast({
          title: "Error",
          description: "Coin amount must be positive",
          variant: "destructive",
        });
        return false;
      }
      
      // Call API to update user's coin balance
      await updateUserCoins(intAmount);
      
      // Only show toast for actual coin earnings, not refreshes
      if (intAmount > 0) {
        toast({
          title: "Success!",
          description: `You earned ${intAmount} coins from ${source}!`,
          variant: "default",
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error adding coins:", error);
      
      toast({
        title: "Error",
        description: "Failed to add coins to your balance. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to check if user can claim daily rewards
  const canClaimDailyReward = () => {
    if (!user) return false;
    
    const lastClaim = user.lastRewardClaim ? new Date(user.lastRewardClaim) : null;
    if (!lastClaim) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastClaim.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  };
  
  // Function to spend coins (for purchases)
  const spendCoins = async (amount: number, item: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make purchases",
        variant: "destructive",
      });
      return false;
    }
    
    if (user.coins < amount) {
      toast({
        title: "Insufficient coins",
        description: `You need ${amount} coins to purchase ${item}`,
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      // Convert to integer
      const intAmount = Math.round(amount);
      
      // Call API to update user's coin balance (negative amount for spending)
      await updateUserCoins(-intAmount);
      
      toast({
        title: "Purchase successful!",
        description: `You spent ${intAmount} coins on ${item}`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Error spending coins:", error);
      
      toast({
        title: "Error",
        description: "Failed to process your purchase. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    coins: user?.coins || 0,
    addCoins,
    spendCoins,
    canClaimDailyReward,
    loading,
  };
}
