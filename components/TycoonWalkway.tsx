import React, { useEffect, useState, useRef } from 'react';

interface TycoonWalkwayProps {
  activeSlot: string | null;
}

export const TycoonWalkway: React.FC<TycoonWalkwayProps> = ({ activeSlot }) => {
  const [position, setPosition] = useState(5);
  const [facingRight, setFacingRight] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Ref to hold the active timeout for wandering/idle behavior
  const wanderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Constants
  const WALK_DURATION = 3000; // 3 seconds for a slower, more dignified walk

  // Helper to clear any pending idle actions
  const clearWander = () => {
      if (wanderTimeout.current) clearTimeout(wanderTimeout.current);
  };

  // Helper to schedule the next idle action
  const scheduleNextAction = (delay: number, action: () => void) => {
      clearWander();
      wanderTimeout.current = setTimeout(action, delay);
  };

  // Main Logic Effect
  useEffect(() => {
    // Whenever the active slot changes (or on mount), we reset behavior
    clearWander();

    // INTERACTION MODE: User selected a slot
    if (activeSlot && activeSlot.startsWith('splot-')) {
        const index = parseInt(activeSlot.split('-')[1]);
        let target = 5;
        // Map columns to position percentages
        if (index === 0) target = 20;
        else if (index === 1) target = 50;
        else if (index === 2) target = 80;
        
        moveCharacter(target);
    } 
    // IDLE MODE: No selection
    else {
        // First, ensure we return to the "home" area if not already there or hiding
        // If currently way out in the field (> 20), walk back.
        if (position > 20) {
            moveCharacter(5);
        }
        
        // Start the idle behavior loop
        startIdleLoop();
    }

    return () => clearWander();
  }, [activeSlot]); 

  // Recursive idle loop
  const startIdleLoop = () => {
      // Random delay before doing something (3-7 seconds)
      const delay = Math.random() * 4000 + 3000;
      
      scheduleNextAction(delay, () => {
          const roll = Math.random();
          
          if (roll < 0.4) {
              // BEHAVIOR 1: Go inside estate (off-screen left)
              moveCharacter(-15); // Walk off screen
              
              // Stay hidden for 4-8 seconds, then come back
              const hideDuration = 4000 + Math.random() * 4000;
              scheduleNextAction(WALK_DURATION + hideDuration, () => {
                  moveCharacter(5); // Come back to entrance
                  // Restart loop after arrival
                  scheduleNextAction(WALK_DURATION + 1000, startIdleLoop);
              });

          } else if (roll < 0.7) {
              // BEHAVIOR 2: Inspect a random spot
              const randomPos = 20 + Math.random() * 50; // Between 20% and 70%
              moveCharacter(randomPos);
              
              // Stay there for 2-4 seconds
              const inspectDuration = 2000 + Math.random() * 2000;
              scheduleNextAction(WALK_DURATION + inspectDuration, () => {
                  moveCharacter(5); // Return home
                  scheduleNextAction(WALK_DURATION + 1000, startIdleLoop);
              });

          } else {
              // BEHAVIOR 3: Just wait longer (do nothing this cycle)
              startIdleLoop();
          }
      });
  };

  const moveCharacter = (target: number) => {
      setPosition(prev => {
          if (prev === target) return prev;
          setFacingRight(target > prev);
          setIsMoving(true);
          setMessage(null); // Clear any message when starting to move
          return target;
      });
  };

  // Effect to handle animation state and arrival events
  useEffect(() => {
      if (isMoving) {
          const timer = setTimeout(() => {
              setIsMoving(false);
              
              // If we arrived at a specific slot while interacting, show a bubble
              if (activeSlot && activeSlot.startsWith('splot-') && position > 0) {
                   const phrases = ["Synergy!", "Maximize ROI", "Liquid assets", "Stonks 📈", "Bullish", "Checking margins", "Buy High?", "Diversify"];
                   setMessage(phrases[Math.floor(Math.random() * phrases.length)]);
              }
          }, WALK_DURATION);
          return () => clearTimeout(timer);
      }
  }, [isMoving, activeSlot, position]);

  return (
    <div className="relative w-full h-16 mb-2 flex items-end overflow-hidden pointer-events-none">
       <style>
        {`
          @keyframes walkBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes popIn {
             0% { opacity: 0; transform: scale(0.5); }
             100% { opacity: 1; transform: scale(1); }
          }
          /* Slower bounce for slower walk speed */
          .walking-bounce { animation: walkBounce 0.5s infinite; } 
          .pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        `}
      </style>

        {/* Pavement */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900/5 border-y border-slate-900/10 rounded-full mx-4">
            <div className="absolute inset-0 flex justify-around opacity-10">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-2 h-full bg-slate-900 transform -skew-x-12" />
                ))}
            </div>
        </div>

        {/* Tycoon Character */}
        <div 
            className="absolute bottom-2 transition-all ease-in-out z-10"
            style={{ 
                left: `${position}%`,
                transitionDuration: `${WALK_DURATION}ms`
            }}
        >
            <div 
                className={`text-4xl filter drop-shadow-md transition-transform duration-300 ${isMoving ? 'walking-bounce' : ''}`}
                style={{ transform: `scaleX(${facingRight ? 1 : -1})` }} 
            >
                🕴️
            </div>
        </div>

        {/* Message Bubble */}
        {!isMoving && message && position > 0 && (
            <div 
                className="absolute bottom-12 transition-all duration-500 ease-in-out z-20 whitespace-nowrap"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
                <div className="bg-white border-2 border-slate-100 px-3 py-1 rounded-tr-xl rounded-tl-xl rounded-br-xl text-[10px] font-bold shadow-md text-slate-600 pop-in">
                    {message}
                </div>
            </div>
        )}
    </div>
  );
};