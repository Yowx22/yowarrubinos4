
import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const WalletDisplay = () => {
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | null>(null);
  
  // Detect balance changes for animations
  useEffect(() => {
    if (user && lastBalance !== null && user.coins !== lastBalance) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (user) {
      setLastBalance(user.coins);
    }
  }, [user?.coins]);
  
  if (!user) return null;
  
  return (
    <motion.div 
      className="bg-spdm-gray border border-spdm-green/30 rounded-lg p-4 flex items-center justify-between shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-spdm-green/20"
          animate={isAnimating ? { rotate: 360 } : {}}
          transition={{ duration: 0.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </motion.div>
        <div>
          <p className="text-sm text-gray-400">Wallet Balance</p>
          <div className="flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.span 
                key={user.coins}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-semibold text-spdm-green mr-1 font-bold"
              >
                {user.coins}
              </motion.span>
            </AnimatePresence>
            <span className="text-white">coins</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <div className="px-3 py-1 rounded-full bg-spdm-green/10 text-spdm-green text-xs font-medium border border-spdm-green/30">
          Active
        </div>
        {user.level !== undefined && (
          <div className="mt-2 text-xs text-gray-400">
            Level <span className="text-spdm-green">{user.level}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WalletDisplay;
