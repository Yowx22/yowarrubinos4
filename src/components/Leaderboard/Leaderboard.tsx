import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          points,
          period_start,
          period_end,
          profiles:profiles(username)
        `)
        .order('points', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const formattedData = data.map(entry => ({
          username: entry.profiles.username,
          points: entry.points,
          period_start: entry.period_start,
          period_end: entry.period_end
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
              <th className="pb-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr 
                key={index}
                className="border-t border-gray-700"
              >
                <td className="py-4 text-gray-300">#{index + 1}</td>
                <td className="py-4 text-spdm-green font-medium">
                  {entry.username}
                </td>
                <td className="py-4 text-right text-gray-300">
                  {entry.points.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;