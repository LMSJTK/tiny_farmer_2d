import React, { useEffect, useState } from 'react';

export const FarmRoad: React.FC = () => {
  const [showTractor, setShowTractor] = useState(false);

  useEffect(() => {
    // Independent random timer for the tractor
    const scheduleNextTractor = () => {
       const delay = Math.random() * 15000 + 10000; // 10-25 seconds
       return setTimeout(() => {
          setShowTractor(true);
       }, delay);
    };

    let timer = scheduleNextTractor();

    return () => clearTimeout(timer);
  }, [showTractor]); // Re-schedule when tractor state resets

  const handleAnimationEnd = () => {
     setShowTractor(false);
  };

  return (
    <div className="relative w-full h-16 bg-amber-900/5 border-y-2 border-amber-900/10 flex items-center justify-around overflow-hidden my-6">
       <style>
        {`
          @keyframes driveRight {
            0% { transform: translateX(-100px); }
            100% { transform: translateX(120vw); }
          }
          @keyframes puff {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-20px) scale(2); }
          }
          .smoke-puff {
             animation: puff 1s ease-out infinite;
          }
        `}
      </style>
      
      {/* Road Markings */}
      {Array.from({ length: 20 }).map((_, i) => (
         <div key={i} className="w-8 h-1 bg-amber-900/10 rounded-full" />
      ))}

      {/* Tractor Animation */}
      {showTractor && (
         <div 
          className="absolute bottom-2 left-0 z-10"
          style={{ animation: 'driveRight 15s linear forwards' }}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="relative text-4xl transform -scale-x-100 filter drop-shadow-lg">
             🚜
             <div className="absolute -top-2 -right-2 text-xs opacity-50 text-slate-500 smoke-puff">💨</div>
             <div className="absolute -top-4 -right-4 text-xs opacity-30 text-slate-500 smoke-puff" style={{ animationDelay: '0.2s' }}>💨</div>
          </div>
        </div>
      )}
    </div>
  );
};