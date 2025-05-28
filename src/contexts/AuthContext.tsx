import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, logToDiscord } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

interface Wallet {
  user_id: string;
  balance: number;
  last_reward_claim?: string | null;
  level?: number;
  updated_at?: string;
}

interface AuthUser {
  id: string;
  email?: string;
  username: string;
  coins: number;
  isAdmin: boolean;
  isOwner: boolean;
  lastRewardClaim?: Date | null;
  lastSpinTime?: Date;
  afkFarmStart?: Date;
  afkFarmCoinsEarned?: number;
  level?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserCoins: (amount: number) => Promise<void>;
  updatePresence: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleAuthError = async (error: any) => {
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('Refresh Token Not Found')) {
      console.error('Auth error detected:', error.message);
      logToDiscord(`Auth error detected: ${error.message}`, 'error');
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Force sign out to clear any invalid tokens
      await supabase.auth.signOut();
      
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      let walletData: Wallet | null = null;
      
      try {
        const { data, error } = await supabase
          .from('wallets' as any)
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) throw error;

        if (!data) {
          // Create wallet with 0 initial balance
          const { error: createWalletError } = await supabase.rpc('update_user_balance', {
            target_user_id: userId,
            amount_change: 0 // Changed from 100 to 0
          });
          
          if (createWalletError) throw createWalletError;
          
          const { data: newWallet, error: newWalletError } = await supabase
            .from('wallets' as any)
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (newWalletError) throw newWalletError;
          walletData = newWallet as unknown as Wallet;
        } else {
          walletData = data as unknown as Wallet;
        }
      } catch (walletError) {
        console.error('Wallet fetch error:', walletError);
        logToDiscord(`Error fetching wallet: ${JSON.stringify(walletError)}`, 'error');
        walletData = {
          user_id: userId,
          balance: 0,
          level: 1,
          last_reward_claim: null
        };
      }

      const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
      if (authUserError) throw authUserError;
      
      const userEmail = authUserData?.user?.email;

      const profile = profileData as UserProfile;
      
      const lastRewardClaim = walletData?.last_reward_claim 
        ? new Date(walletData.last_reward_claim) 
        : null;

      const userData: AuthUser = {
        id: userId,
        email: userEmail,
        username: profile.username,
        coins: walletData?.balance || 0,
        isAdmin: profile.is_admin || false,
        isOwner: profile.is_owner || false,
        lastRewardClaim: lastRewardClaim,
        level: walletData?.level || 1,
      };

      setUser(userData);
      logToDiscord(`User logged in: ${profile.username}`, 'info');
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      logToDiscord(`Error fetching user data: ${JSON.stringify(error)}`, 'error');
      await handleAuthError(error);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            try {
              if (event === 'TOKEN_REFRESHED') {
                logToDiscord('Token refreshed successfully', 'info');
              }
              
              setSession(currentSession);
              
              if (currentSession?.user) {
                await fetchUserData(currentSession.user.id);
              } else {
                setUser(null);
              }
            } catch (error: any) {
              console.error('Auth state change error:', error);
              await handleAuthError(error);
            }
          }
        );

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(data.session);
        
        if (data.session?.user) {
          await fetchUserData(data.session.user.id);
        }
        
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error('Setup auth error:', error);
        await handleAuthError(error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const updatePresence = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('insert_or_update_user_presence', {
        p_user_id: user.id,
        p_status: 'online'
      });

      if (error) {
        console.error('Error updating user presence with RPC:', error);
        logToDiscord(`Error updating user presence: ${error.message}`, 'error');
        await handleAuthError(error);
      }
      
      const channel = supabase.channel('presence-updates');
      channel.send({
        type: 'broadcast',
        event: 'presence-update',
        payload: { user_id: user.id }
      });
      
    } catch (error: any) {
      console.error('Error updating user presence:', error);
      logToDiscord(`Error updating user presence: ${error.message}`, 'error');
      await handleAuthError(error);
    }
  };

  useEffect(() => {
    if (!user) return;

    updatePresence();
    const interval = setInterval(updatePresence, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Login successful!",
        description: "Welcome back to Yowx Mods!",
      });
      logToDiscord(`User login successful: ${email}`, 'info');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      logToDiscord(`Login failed: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;
      toast({
        title: "Account created!",
        description: "Welcome to Yowx Mods!",
      });
      logToDiscord(`New user signup: ${username} (${email})`, 'info');
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
      logToDiscord(`Signup failed: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        logToDiscord(`User logged out: ${user.username}`, 'info');
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error: any) {
      console.error('Logout failed:', error);
      logToDiscord(`Logout failed: ${error.message}`, 'error');
    }
  };

  const updateUserCoins = async (amount: number) => {
    if (!user) return;

    const intAmount = Math.round(amount);

    try {
      const { data, error } = await supabase.rpc('update_user_balance', {
        target_user_id: user.id,
        amount_change: intAmount
      });

      if (error) {
        console.error('Error in updateUserCoins:', error);
        logToDiscord(`Error updating balance via RPC: ${error.message}`, 'error');
        await handleAuthError(error);
        throw error;
      }

      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        console.error('Error fetching updated wallet:', walletError);
        logToDiscord(`Error fetching updated wallet: ${walletError.message}`, 'error');
        await handleAuthError(walletError);
        
        setUser(prev => prev ? {
          ...prev,
          coins: prev.coins + intAmount
        } : null);
      } else if (updatedWallet) {
        const wallet = updatedWallet as unknown as Wallet;
        setUser(prev => prev ? {
          ...prev,
          coins: wallet.balance,
          level: wallet.level || prev.level
        } : null);
      }

      logToDiscord(`User ${user.username} coins updated: ${intAmount > 0 ? '+' : ''}${intAmount} coins`, 'info');
    } catch (error: any) {
      console.error('Error updating user balance:', error);
      logToDiscord(`Error updating user balance: ${error.message}`, 'error');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      login, 
      signup, 
      logout,
      updateUserCoins,
      updatePresence
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};