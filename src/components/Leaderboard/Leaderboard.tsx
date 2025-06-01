import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  username: string;
  points: number;
  period_start: string;
  period_end: string;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
    // Set up interval to refresh leaderboard every minute
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select(`
          balance,
          profiles:profiles(username)
        `)
        .order('balance', { ascending: false })
        .limit(10);

      if (walletError) throw walletError;

      if (walletData) {
        const formattedData = walletData.map(entry => ({
          username: entry.profiles.username,
          points: entry.balance,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString()
        }));
        setLeaderboard(formattedData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-spdm-green"></div>
      </div>
    );
  }

  return (
    <div className="bg-spdm-gray rounded-lg p-6">
      <h2 className="text-xl font-bold text-spdm-green mb-4">Top Players</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pb-4">Rank</th>
              <th className="pb-4">Username</th>
              <th className="pb-4 text-right">Coins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-t border-gray-700"
              >
                <td className="py-4 text-gray-300">#{index + 1}</td>
                <td className="py-4 text-spdm-green font-medium">
                  {entry.username}
                  {user?.username === entry.username && (
                    <span className="ml-2 text-xs bg-spdm-green/20 text-spdm-green px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </td>
                <td className="py-4 text-right text-gray-300">
                  {entry.points.toLocaleString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;