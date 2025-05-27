import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCoins } from '@/hooks/useCoins';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isExploded?: boolean;
}

const Mines: React.FC = () => {
  const { user } = useAuth();
  const { coins, addCoins, spendCoins } = useCoins();
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [betAmount, setBetAmount] = useState<number>(5);
  const [minesCount, setMinesCount] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Calculate base multiplier based on mines count
  const getBaseMultiplier = (mines: number) => {
    const multipliers = {
      1: 1.30, 2: 1.35, 3: 1.40, 4: 1.45, 5: 0.90,
      6: 1.55, 7: 1.60, 8: 1.65, 9: 1.70, 10: 1.75,
      11: 1.80, 12: 1.85, 13: 1.90, 14: 2.00, 15: 2.10,
      16: 2.20, 17: 2.35, 18: 2.50, 19: 2.70, 20: 3.00,
      21: 3.50, 22: 4.20, 23: 5.50, 24: 9.00
    };
    return multipliers[mines as keyof typeof multipliers] || 1.30;
  };

  // Calculate multiplier increase per safe pick
  const getMultiplierIncrease = (mines: number) => {
    const increases = {
      1: 1.15, 2: 1.17, 3: 1.19, 4: 1.22, 5: 1.25,
      6: 1.28, 7: 1.31, 8: 1.34, 9: 1.37, 10: 1.40,
      11: 1.44, 12: 1.48, 13: 1.52, 14: 1.56, 15: 1.60,
      16: 1.65, 17: 1.70, 18: 1.75, 19: 1.80, 20: 1.85,
      21: 1.90, 22: 2.00, 23: 2.25, 24: 2.50
    };
    return increases[mines as keyof typeof increases] || 1.15;
  };

  const initializeGrid = async () => {
    if (!user) return;

    try {
      // Check if user is rigged
      const { data: riggedData, error: riggedError } = await supabase
        .from('rigged_users')
        .select('win_chance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (riggedError) {
        console.error('Error checking rigged status:', riggedError);
      }

      const winChance = riggedData?.win_chance ?? 0.5; // Default 50% win chance if not rigged
      const shouldWin = Math.random() < winChance;

      const newGrid: Cell[][] = Array(5).fill(null).map(() =>
        Array(5).fill(null).map(() => ({
          isMine: false,
          isRevealed: false
        }))
      );

      // Place mines
      let minesToPlace = minesCount;
      while (minesToPlace > 0) {
        const row = Math.floor(Math.random() * 5);
        const col = Math.floor(Math.random() * 5);
        if (!newGrid[row][col].isMine) {
          newGrid[row][col].isMine = true;
          minesToPlace--;
        }
      }

      // If rigged to win, ensure first click is safe
      if (shouldWin) {
        let safeCellFound = false;
        for (let i = 0; i < 5 && !safeCellFound; i++) {
          for (let j = 0; j < 5 && !safeCellFound; j++) {
            if (!newGrid[i][j].isMine) {
              safeCellFound = true;
              // Ensure this cell remains safe
              newGrid[i][j].isMine = false;
            }
          }
        }
      }

      setGrid(newGrid);
      setCurrentMultiplier(getBaseMultiplier(minesCount));
      setRevealedCount(0);
      setGameOver(false);
      setHasWon(false);
    } catch (error) {
      console.error('Error initializing grid:', error);
      toast.error('Failed to initialize game');
    }
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!isPlaying || grid[row][col].isRevealed || gameOver) return;

    const newGrid = [...grid];
    newGrid[row][col].isRevealed = true;

    if (newGrid[row][col].isMine) {
      // Hit a mine
      newGrid[row][col].isExploded = true;
      setGrid(newGrid);
      setGameOver(true);
      setHasWon(false);
      revealAllMines();
      toast.error('Game Over! You hit a mine!');
    } else {
      // Safe cell
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);
      const newMultiplier = currentMultiplier * getMultiplierIncrease(minesCount);
      setCurrentMultiplier(newMultiplier);
      setGrid(newGrid);

      // Check if all safe cells are revealed
      const totalSafeCells = 25 - minesCount;
      if (newRevealedCount === totalSafeCells) {
        setGameOver(true);
        setHasWon(true);
        const winnings = Math.floor(betAmount * newMultiplier);
        await addCoins(winnings, 'Mines game win');
        toast.success(`Congratulations! You won ${winnings} coins!`);
      }
    }
  };

  const revealAllMines = () => {
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        isRevealed: cell.isMine ? true : cell.isRevealed
      }))
    );
    setGrid(newGrid);
  };

  const handleBetAmountChange = (value: string) => {
    const amount = parseInt(value);
    if (!isNaN(amount)) {
      setBetAmount(Math.max(5, Math.min(1000000, amount)));
    }
  };

  const handleMinesCountChange = (value: string) => {
    const count = parseInt(value);
    if (!isNaN(count)) {
      setMinesCount(Math.max(1, Math.min(24, count)));
    }
  };

  const startGame = async () => {
    if (!user) {
      toast.error('Please login to play');
      return;
    }

    if (betAmount < 5 || betAmount > 1000000) {
      toast.error('Bet amount must be between 5 and 1,000,000 coins');
      return;
    }

    if (minesCount < 1 || minesCount > 24) {
      toast.error('Number of mines must be between 1 and 24');
      return;
    }

    if (betAmount > coins) {
      toast.error('Insufficient coins');
      return;
    }

    try {
      const success = await spendCoins(betAmount, 'Mines game bet');
      if (success) {
        await initializeGrid();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  const cashOut = async () => {
    if (!isPlaying || gameOver) return;

    const winnings = Math.floor(betAmount * currentMultiplier);
    await addCoins(winnings, 'Mines game cash out');
    setGameOver(true);
    setHasWon(true);
    toast.success(`Cashed out! You won ${winnings} coins!`);
    revealAllMines();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-spdm-dark rounded-lg p-6 border border-spdm-green/20">
        <h2 className="text-2xl font-bold text-spdm-green mb-6 text-center">Mines Game</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Game Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Bet Amount (5-1,000,000)
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetAmountChange(e.target.value)}
                min={5}
                max={1000000}
                disabled={isPlaying}
                className="bg-spdm-gray border-spdm-green/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Number of Mines (1-24)
              </label>
              <Input
                type="number"
                value={minesCount}
                onChange={(e) => handleMinesCountChange(e.target.value)}
                min={1}
                max={24}
                disabled={isPlaying}
                className="bg-spdm-gray border-spdm-green/30"
              />
            </div>

            <Button
              onClick={isPlaying ? cashOut : startGame}
              disabled={gameOver}
              className={`w-full ${
                isPlaying
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  : 'bg-spdm-green hover:bg-spdm-darkGreen text-black'
              }`}
            >
              {isPlaying ? 'Cash Out' : 'Place Bet'}
            </Button>
          </div>

          {/* Game Stats */}
          <div className="space-y-4">
            <div className="bg-spdm-gray rounded-lg p-4 border border-spdm-green/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Current Multiplier</span>
                <span className="text-xl font-bold text-spdm-green">
                  {currentMultiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Potential Win</span>
                <span className="text-lg text-spdm-green">
                  {Math.floor(betAmount * currentMultiplier)} coins
                </span>
              </div>
            </div>

            {gameOver && (
              <div className={`text-center p-4 rounded-lg ${
                hasWon ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <p className="text-lg font-bold">
                  {hasWon ? 'You Won!' : 'Game Over!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`aspect-square rounded-lg ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-red-500'
                      : 'bg-spdm-green'
                    : 'bg-spdm-gray hover:bg-spdm-green/20'
                } border border-spdm-green/20 transition-colors disabled:cursor-not-allowed`}
                disabled={!isPlaying || cell.isRevealed || gameOver}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={cell.isRevealed ? { scale: [1, 1.2, 1] } : {}}
              >
                {cell.isRevealed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-full h-full flex items-center justify-center ${
                      cell.isMine ? 'text-white' : 'text-black'
                    }`}
                  >
                    {cell.isMine ? '💣' : '✓'}
                  </motion.div>
                )}
              </motion.button>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mines;