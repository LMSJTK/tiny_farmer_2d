import React, { useEffect, useState } from 'react';
import { GameState, SpecialBuildingType } from '../types';

interface WorldAnimationsProps {
  state: GameState;
}

type ActiveEvent = 'SANTA' | null;

export const WorldAnimations: React.FC<WorldAnimationsProps> = ({ state }) => {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent>(null);
  
  // Unlock checks
  const isChristmas = state.isSeasonalAreaUnlocked;
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeEvent) return; 

      const rand = Math.random();
      
      // 10% chance for Santa (If Seasonal unlocked)
      if (rand < 0.3 && isChristmas) {
        setActiveEvent('SANTA');
      }

    }, 5000); 

    return () => clearInterval(interval);
  }, [activeEvent, isChristmas]);

  const handleAnimationEnd = () => {
    setActiveEvent(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <style>
        {`
          @keyframes flyOver {
            0% { transform: translate(-100px, 100px) rotate(-10deg); }
            100% { transform: translate(120vw, -50vh) rotate(-10deg); }
          }
        `}
      </style>

      {/* SANTA EVENT (Fixed Overlay) */}
      {activeEvent === 'SANTA' && (
        <div 
          className="fixed top-20 left-0 z-50 pointer-events-none"
          style={{ animation: 'flyOver 8s linear forwards' }}
          onAnimationEnd={handleAnimationEnd}
        >
           <div className="relative text-6xl filter drop-shadow-2xl">
              🎅
              <span className="absolute top-2 -right-8 text-4xl transform -scale-x-100">🦌</span>
              <div className="absolute top-10 left-0 text-white/50 text-sm animate-pulse">Ho ho ho!</div>
           </div>
        </div>
      )}

    </div>
  );
};