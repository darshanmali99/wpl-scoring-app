import React from 'react';

type NeonButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'green' | 'blue';
  variant?: 'solid' | 'outline';
};

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  color = 'green', 
  variant = 'solid', 
  className = '', 
  ...props 
}) => {
  const baseClasses = "px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const greenClasses = variant === 'solid' 
    ? "bg-neonGreen text-black hover:neon-glow-green" 
    : "border-2 border-neonGreen text-neonGreen hover:bg-neonGreen/10 hover:neon-glow-green";
    
  const blueClasses = variant === 'solid' 
    ? "bg-neonBlue text-black hover:neon-glow-blue" 
    : "border-2 border-neonBlue text-neonBlue hover:bg-neonBlue/10 hover:neon-glow-blue";

  return (
    <button 
      className={`${baseClasses} ${color === 'green' ? greenClasses : blueClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
