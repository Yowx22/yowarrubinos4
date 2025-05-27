import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Dashboard from '../components/Dashboard/Dashboard';
import AuthModal from '../components/Auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface IndexProps {
  activeTab?: 'rewards' | 'spin' | 'shop' | 'afk';
}

const Index = ({
  activeTab: initialTab
}: IndexProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rewards' | 'spin' | 'shop' | 'afk'>(initialTab || 'rewards');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('signup');
  const [showLightning, setShowLightning] = useState(false);

  // Effect for lightning animation
  useEffect(() => {
    if (!user) {
      setShowLightning(true);
      const timer = setTimeout(() => setShowLightning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Reference to create bubbles
  const containerRef = useRef<HTMLDivElement>(null);

  // Create bubbles on click
  const createBubbles = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Create 5 bubbles at random positions around the click
    for (let i = 0; i < 5; i++) {
      const size = Math.random() * 30 + 10; // Random size between 10-40px
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      const bubble = document.createElement('div');
      bubble.className = 'bubble animate-bubble-up';
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${x + offsetX}px`;
      bubble.style.top = `${y + offsetY}px`;
      container.appendChild(bubble);

      // Remove bubble after animation ends
      setTimeout(() => {
        if (container.contains(bubble)) {
          container.removeChild(bubble);
        }
      }, 2000);
    }
  };

  // Simulated loading state for the hero
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // If user is logged in and there's a hash in the URL, show the appropriate tab
  useEffect(() => {
    if (user && initialTab) {
      setActiveTab(initialTab);
    }
  }, [user, initialTab]);

  const handleGetStarted = () => {
    setAuthType('signup');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthType('login');
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Payment method data
  const paymentMethods = [
    {
      name: "PayPal",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png",
      description: "Fast and secure international payments"
    },
    {
      name: "Zelle",
      logo: "https://logodownload.org/wp-content/uploads/2022/03/zelle-logo-1.png",
      description: "Instant bank transfers (US only)"
    },
    {
      name: "Cash App",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Square_Cash_app_logo.svg/1200px-Square_Cash_app_logo.svg.png",
      description: "Quick and easy mobile payments"
    },
    {
      name: "BBVA México",
      logo: "https://brandemia.org/contenido/subidas/2019/04/logo-bbva-960x640.jpg",
      description: "Direct bank transfers in Mexico"
    },
    {
      name: "Oxxo",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Oxxo_Logo.svg/2560px-Oxxo_Logo.svg.png",
      description: "Cash payments at any Oxxo store"
    },
    {
      name: "Free Fire Account",
      logo: "https://cdn.pixabay.com/photo/2021/08/31/18/28/garena-free-fire-6589783_1280.png",
      description: "Trade with Free Fire accounts"
    }
  ];

  const handlePaymentClick = () => {
    window.open('https://t.me/yowxios', '_blank');
  };

  return (
    <div className="min-h-screen bg-spdm-black text-white overflow-hidden" ref={containerRef} onClick={createBubbles}>
      <Header onLoginClick={handleLogin} onSignupClick={handleGetStarted} />
      
      {/* Lightning animation */}
      {showLightning && (
        <motion.div
          className="lightning-animation"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.2, 0.4, 0.6, 1] }}
        />
      )}
      
      {/* Gradient overlay for visual effect */}
      <div className="fixed inset-0 bg-gradient-to-b from-spdm-green/5 to-transparent pointer-events-none"></div>
      
      {user ? (
        <div className="pt-24 pb-20 dashboard-bg">
          <Dashboard activeTab={activeTab} />
        </div>
      ) : (
        <div className="relative">
          {/* Hero Section */}
          <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-96 h-96 bg-spdm-green/20 rounded-full blur-3xl -top-20 -left-20 animate-float opacity-30"></div>
              <div className="absolute w-64 h-64 bg-spdm-green/20 rounded-full blur-3xl bottom-20 right-10 animate-float opacity-20" style={{
                animationDelay: '1s'
              }}></div>
            </div>
            
            <div className="max-w-4xl w-full text-center relative z-10">
              <div className={`transition-all duration-700 ${loading ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 glow-text">
                  <span className="text-spdm-green">YOWX</span> MODS
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
                  Join our community, earn rewards, and unlock premium features
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <motion.button onClick={handleGetStarted} className="px-8 py-4 rounded-full bg-spdm-green hover:bg-spdm-darkGreen text-black font-semibold text-lg transition-all hover:shadow-lg hover:shadow-spdm-green/20" whileTap={{
                    scale: 0.95
                  }} whileHover={{
                    scale: 1.05
                  }}>
                    Get Started
                  </motion.button>
                  
                  <motion.button onClick={() => window.open('https://discord.gg/aJaKPWr42x', '_blank')} className="px-8 py-4 rounded-full bg-transparent hover:bg-spdm-green/10 border-2 border-spdm-green text-spdm-green font-semibold text-lg transition-all" whileTap={{
                    scale: 0.95
                  }} whileHover={{
                    scale: 1.05
                  }}>
                    Join Discord
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <FeatureCard title="Free Daily Coins" description="Complete simple tasks to earn coins every day" />
                  <FeatureCard title="Spin & Win" description="Spin the wheel for a chance to win up to 100 coins" />
                  <FeatureCard title="AFK Farming" description="Earn passive coins just by keeping the page open" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="py-20 bg-spdm-dark">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-spdm-green glow-text">
                Premium Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20 hover:border-spdm-green/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-spdm-green/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Premium Access</h3>
                  <p className="text-gray-400">
                    Unlock exclusive content and features with our premium keys
                  </p>
                </div>
                
                <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20 hover:border-spdm-green/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-spdm-green/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Community Access</h3>
                  <p className="text-gray-400">
                    Join our WhatsApp and Discord communities for exclusive updates
                  </p>
                </div>
                
                <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20 hover:border-spdm-green/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-spdm-green/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure System</h3>
                  <p className="text-gray-400">
                    Our key system provides secure and reliable access management
                  </p>
                </div>
                
                <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20 hover:border-spdm-green/50 transition-all">
                  <div className="w-12 h-12 rounded-full bg-spdm-green/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Daily Rewards</h3>
                  <p className="text-gray-400">
                    Earn coins daily through various activities and redeem them for keys
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="py-20 px-4 bg-gradient-to-t from-black to-spdm-dark">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-spdm-green glow-text">
                  Payment Methods
                </h2>
                <p className="text-xl text-gray-300">
                  Multiple secure payment options available
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {paymentMethods.map((method, index) => (
                  <motion.div
                    key={method.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={handlePaymentClick}
                    className="bg-spdm-gray rounded-lg p-4 border border-spdm-green/20 hover:border-spdm-green/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-4">
                      {method.logo ? (
                        <div className="h-12 flex items-center justify-center">
                          <img 
                            src={method.logo} 
                            alt={method.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-center text-lg font-bold text-spdm-green">
                          {method.name}
                        </div>
                      )}
                      <p className="text-sm text-gray-400 text-center">
                        {method.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 text-center"
              >
                <p className="text-gray-400">
                  Need help with payment? Contact our support team
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('https://discord.gg/aJaKPWr42x', '_blank')}
                  className="mt-4 px-8 py-3 bg-transparent hover:bg-spdm-green/10 border-2 border-spdm-green text-spdm-green font-semibold rounded-full transition-all"
                >
                  Contact Support
                </motion.button>
              </motion.div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="py-20 px-4 bg-gradient-to-b from-black to-spdm-dark">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-spdm-green glow-text">
                Ready to get started?
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Create an account today and start earning coins
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button onClick={handleGetStarted} className="px-8 py-4 rounded-full bg-spdm-green hover:bg-spdm-darkGreen text-black font-semibold text-lg transition-all hover:shadow-lg hover:shadow-spdm-green/20" whileTap={{
                  scale: 0.95
                }} whileHover={{
                  scale: 1.05
                }}>
                  Sign Up Now
                </motion.button>
                <motion.button onClick={() => window.open('https://chat.whatsapp.com/KteLnsPOMEKIJw3I1phViP', '_blank')} className="px-8 py-4 rounded-full bg-transparent hover:bg-spdm-green/10 border-2 border-spdm-green text-spdm-green font-semibold text-lg transition-all" whileTap={{
                  scale: 0.95
                }} whileHover={{
                  scale: 1.05
                }}>
                  Join WhatsApp
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={closeAuthModal} 
          type={authType} 
        />
      )}
    </div>
  );
};

// Feature card component
const FeatureCard = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <motion.div
    className="bg-spdm-dark bg-opacity-80 backdrop-blur-sm p-6 rounded-lg border border-spdm-green/20 hover:border-spdm-green/50 transition-all"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
  >
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default Index;