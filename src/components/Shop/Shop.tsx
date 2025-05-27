
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCoins } from '@/hooks/useCoins';
import { useAuth } from '@/hooks/useAuth';
import Purchase from './Purchase';

interface ShopItem {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  price: number;
  description: string;
}

const Shop = () => {
  const { coins, spendCoins } = useCoins();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const shopItems: ShopItem[] = [
    {
      id: 'key_1day',
      name: '1 Day Key',
      duration: '1 Day',
      durationDays: 1,
      price: 20,
      description: 'Access to premium features for 24 hours'
    },
    {
      id: 'key_7days',
      name: '7 Days Key',
      duration: '7 Days',
      durationDays: 7,
      price: 100,
      description: 'Access to premium features for a full week'
    },
    {
      id: 'key_30days',
      name: '30 Days Key',
      duration: '30 Days',
      durationDays: 30,
      price: 500,
      description: 'Access to premium features for a month'
    },
    {
      id: 'key_1year',
      name: '1 Year Key',
      duration: '1 Year',
      durationDays: 365,
      price: 2000,
      description: 'Access to premium features for a full year'
    }
  ];
  
  const handlePurchase = (item: ShopItem) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to make a purchase",
        variant: "destructive",
      });
      return;
    }
    
    if (coins < item.price) {
      toast({
        title: "Insufficient coins",
        description: `You need ${item.price} coins to purchase this item`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedItem(item);
    setIsPurchasing(true);
  };
  
  const closePurchaseModal = () => {
    setIsPurchasing(false);
    setSelectedItem(null);
  };
  
  if (!user) {
    return (
      <div className="p-6 bg-spdm-gray rounded-lg text-center">
        <h2 className="text-xl font-semibold text-spdm-green mb-3">Shop</h2>
        <p className="text-gray-400">Please login to access the shop.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-spdm-gray rounded-lg p-5 border border-spdm-green/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-spdm-green">Key Shop</h2>
          <div className="px-4 py-1.5 rounded-full bg-spdm-dark border border-spdm-green/30 text-spdm-green">
            <span className="font-medium">{coins}</span> coins available
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shopItems.map((item) => (
            <div 
              key={item.id}
              className="bg-spdm-dark rounded-lg p-4 border border-spdm-green/20 hover:border-spdm-green/50 transition-all flex flex-col"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-spdm-green/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-spdm-green">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-white text-center">{item.name}</h3>
              <p className="text-sm text-gray-400 text-center mt-1 mb-3">{item.description}</p>
              
              <div className="text-center text-2xl font-bold text-spdm-green mt-auto mb-4">
                {item.price} <span className="text-sm font-normal text-gray-400">coins</span>
              </div>
              
              <button
                onClick={() => handlePurchase(item)}
                className={`w-full py-2 rounded-md font-medium ${
                  coins >= item.price
                    ? 'bg-spdm-green hover:bg-spdm-darkGreen text-black'
                    : 'bg-gray-700 cursor-not-allowed text-gray-300'
                }`}
                disabled={coins < item.price}
              >
                {coins >= item.price ? 'Purchase' : 'Not enough coins'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-spdm-dark rounded-lg p-4 border border-yellow-500/30">
        <h3 className="text-yellow-400 font-medium mb-1">How to get more coins</h3>
        <p className="text-sm text-gray-300">
          You can earn coins by completing reward tasks, using the spin wheel, or using the AFK farm. 
          The more coins you collect, the better items you can purchase!
        </p>
      </div>
      
      {isPurchasing && selectedItem && (
        <Purchase item={selectedItem} onClose={closePurchaseModal} />
      )}
    </div>
  );
};

export default Shop;
