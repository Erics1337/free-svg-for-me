import React from 'react';
import { Coffee } from 'lucide-react';

interface BuyMeCoffeeProps {
  username?: string; // Your username on buymeacoffee.com
  className?: string;
}

export const BuyMeCoffee: React.FC<BuyMeCoffeeProps> = ({ 
  username = "erics1337", 
  className = "" 
}) => {
  return (
    <a
      href={`https://www.buymeacoffee.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        bg-[#FFDD00] text-black font-semibold text-sm
        hover:bg-[#FFDD00]/90 transition-colors shadow-lg hover:shadow-[#FFDD00]/20
        ${className}
      `}
    >
      <Coffee className="w-4 h-4" />
      <span>Buy me a coffee</span>
    </a>
  );
};
