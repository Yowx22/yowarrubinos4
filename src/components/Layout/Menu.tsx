import { motion } from 'framer-motion';
import { Menu as MenuIcon, Youtube, Gift, ShoppingBag, Bug, Gamepad, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Menu = ({ isOpen, onClose, onLoginClick, onSignupClick }: MenuProps) => {
  const { user } = useAuth();
  
  const menuItems = [
    {
      name: 'Shop',
      icon: <ShoppingBag className="w-5 h-5" />,
      href: '/shop'
    },
    {
      name: 'Free Key',
      icon: <Gift className="w-5 h-5" />,
      href: '/free-key'
    },
    {
      name: 'Bug Report',
      icon: <Bug className="w-5 h-5" />,
      href: '/bug-report'
    },
    {
      name: 'Games',
      icon: <Gamepad className="w-5 h-5" />,
      submenu: [
        {
          name: 'Mines',
          href: '/games/mines'
        }
      ]
    }
  ];

  // Add Admin/Owner Panel item if user has appropriate permissions
  if (user?.isAdmin || user?.isOwner) {
    menuItems.push({
      name: `${user.isOwner ? 'Owner' : 'Admin'} Panel`,
      icon: <Shield className="w-5 h-5" />,
      href: '/admin'
    });
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <motion.div
        className={`fixed top-0 right-0 w-full md:w-80 h-full bg-black border-l border-spdm-green/30 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-spdm-green/20">
            <h2 className="text-xl font-semibold text-spdm-green">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-spdm-green/10 text-spdm-green transition-colors"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 py-4 bg-black">
            {menuItems.map((item) => (
              <div key={item.name} className="px-4 py-2">
                {item.submenu ? (
                  <div>
                    <div className="flex items-center gap-3 text-gray-300 px-3 py-2">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <div className="pl-8">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className="block px-3 py-2 text-gray-400 hover:text-spdm-green hover:bg-spdm-green/10 rounded-md transition-colors"
                          onClick={onClose}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className="flex items-center gap-3 text-gray-300 hover:text-spdm-green hover:bg-spdm-green/10 px-3 py-2 rounded-md transition-colors"
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}

            {/* MediaFire Link */}
            <a
              href="https://www.mediafire.com/login/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-300 hover:text-spdm-green hover:bg-spdm-green/10 px-7 py-2 mt-4"
              onClick={onClose}
            >
              <img src="https://static.mediafire.com/images/favicon/favicon.ico" alt="MediaFire" className="w-5 h-5" />
              <span>MediaFire</span>
            </a>

            {/* YouTube Channel */}
            <a
              href="https://www.youtube.com/@yowxmods"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-300 hover:text-spdm-green hover:bg-spdm-green/10 px-7 py-2 mt-4"
              onClick={onClose}
            >
              <Youtube className="w-5 h-5" />
              <span>YouTube Channel</span>
            </a>
          </div>

          {/* Auth Buttons (Mobile Only) */}
          {(onLoginClick || onSignupClick) && (
            <div className="p-4 border-t border-spdm-green/20 md:hidden bg-black">
              <div className="flex flex-col gap-2">
                {onLoginClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onLoginClick();
                    }}
                    className="w-full px-4 py-2 text-sm rounded-full border border-spdm-green text-spdm-green hover:bg-spdm-green/10 transition-colors"
                  >
                    Login
                  </button>
                )}
                {onSignupClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onSignupClick();
                    }}
                    className="w-full px-4 py-2 text-sm rounded-full bg-spdm-green text-black font-medium hover:bg-spdm-darkGreen transition-colors"
                  >
                    Sign Up
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Menu;