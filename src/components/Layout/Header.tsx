import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Users, ChevronDown, LogOut, Settings, Shield } from 'lucide-react';
import SideMenu from './Menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { SettingsDialog } from '@/components/Settings/SettingsDialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OnlineUser {
  user_id: string;
  username: string;
  last_active: string;
  status: string;
}

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Header = ({ onLoginClick, onSignupClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const { data: activeUsers, error: activeUsersError } = await supabase.rpc('get_active_user_ids');
        
        if (activeUsersError) throw activeUsersError;
        
        if (Array.isArray(activeUsers) && activeUsers.length > 0) {
          const userIds = activeUsers.map(user => user.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
          
          if (profilesError) throw profilesError;

          if (profilesData) {
            const formattedUsers = profilesData.map(item => ({
              user_id: item.id,
              username: item.username,
              last_active: new Date().toISOString(),
              status: 'online'
            }));

            setOnlineUsers(formattedUsers);
          }
        } else {
          setOnlineUsers([]);
        }
      } catch (error) {
        console.error("Error fetching online users:", error);
      }
    };

    fetchOnlineUsers();
    
    const channel = supabase
      .channel('presence-updates')
      .on('broadcast', { event: 'presence-update' }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-black">
      <div className="flex items-center">
        <div className="text-xl md:text-2xl font-bold tracking-wider text-spdm-green glow-text">
          MODS
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {!user && onLoginClick && onSignupClick && (
          <div className="hidden sm:flex items-center gap-3">
            <motion.button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm rounded-full border border-spdm-green text-spdm-green hover:bg-spdm-green/10 transition-all"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Login
            </motion.button>
            <motion.button
              onClick={onSignupClick}
              className="px-4 py-2 text-sm rounded-full bg-spdm-green text-black font-medium hover:bg-spdm-darkGreen transition-all"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Sign Up
            </motion.button>
          </div>
        )}

        {user && (
          <motion.div 
            className="hidden sm:flex items-center bg-spdm-gray/60 border border-spdm-green/30 rounded-full px-3 py-1.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-spdm-green/20 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-spdm-green">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <span className="text-sm text-spdm-green font-medium">{user.coins} coins</span>
          </motion.div>
        )}
        
        {user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button 
                onClick={() => setShowOnlineUsers(!showOnlineUsers)} 
                className="relative flex items-center justify-center p-2 rounded-full hover:bg-spdm-gray transition-all duration-200"
                whileTap={{ scale: 0.9 }}
              >
                <Users size={20} className="text-spdm-green" />
                <motion.span 
                  className="absolute -top-1 -right-1 bg-green-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {onlineUsers.length}
                </motion.span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Online Users</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {showOnlineUsers && (
          <div className="absolute top-16 right-20 bg-black border border-spdm-green/30 rounded-lg shadow-lg p-3 min-w-[200px] max-h-[300px] overflow-y-auto animate-fade-in z-50">
            <h3 className="text-sm font-medium text-spdm-green mb-2">Online Users ({onlineUsers.length})</h3>
            <div className="space-y-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map(user => (
                  <div key={user.user_id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-300">{user.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No one is online</p>
              )}
            </div>
          </div>
        )}
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-spdm-gray/50 border border-spdm-green/20 hover:bg-spdm-gray transition-all duration-200 cursor-pointer"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-spdm-green/20">
                  <User size={16} className="text-spdm-green" />
                </div>
                <span className="text-sm text-gray-200 hidden md:inline">{user.username}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border border-spdm-green/30 text-white min-w-[180px] animate-fade-in">
              <DropdownMenuLabel className="text-gray-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-spdm-green/20" />
              <DropdownMenuItem 
                className="hover:bg-spdm-green/20 focus:bg-spdm-green/20 active:scale-98 transition-all cursor-pointer"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={16} className="mr-2 text-spdm-green" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              {user.isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-spdm-green/20" />
                  <DropdownMenuItem 
                    className="hover:bg-spdm-green/20 focus:bg-spdm-green/20 active:scale-98 transition-all cursor-pointer"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield size={16} className="mr-2 text-spdm-green" />
                    <span>{user.isOwner ? 'Owner Panel' : 'Admin Panel'}</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator className="bg-spdm-green/20" />
              <DropdownMenuItem 
                className="hover:bg-red-500/20 focus:bg-red-500/20 active:scale-98 transition-all cursor-pointer" 
                onClick={logout}
              >
                <LogOut size={16} className="mr-2 text-red-400" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        
        <motion.button 
          onClick={toggleMenu}
          className="flex items-center justify-center p-2 rounded-md hover:bg-spdm-gray transition-all duration-200"
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-spdm-green" />
        </motion.button>
      </div>

      <SideMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        onLoginClick={onLoginClick} 
        onSignupClick={onSignupClick}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </header>
  );
};

export default Header;