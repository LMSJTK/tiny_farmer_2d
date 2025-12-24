import React from 'react';
import { TreeOrnaments } from '../types';
import { Star, Gift, Zap, Sparkles } from 'lucide-react';

interface ChristmasTreeProps {
  ornaments: TreeOrnaments;
  unlocked: boolean;
  onUnlockSeasonal: () => void;
  canAffordUnlock: boolean;
  cost: number;
}

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ 
  ornaments, 
  unlocked, 
  onUnlockSeasonal, 
  canAffordUnlock,
  cost 
}) => {
  const collectedCount = Object.values(ornaments).filter(Boolean).length;
  const isFullyDecorated = collectedCount === 5;

  return (
    <div className="relative group">
       {/* The Tree Visual */}
       <div className="flex flex-col items-center">
          <div className="relative w-32 h-40 flex flex-col items-center">
             {/* Star */}
             {ornaments.star && (
                <div className="absolute -top-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse z-20">
                   <Star size={32} fill="currentColor" />
                </div>
             )}
             
             {/* Tree Layers */}
             <div className={`w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[40px] ${unlocked ? 'border-b-green-700' : 'border-b-green-800'} relative transition-colors`}>
                {ornaments.lights && <div className="absolute top-4 left-[-15px] w-8 h-1 bg-yellow-300 rounded-full blur-[2px] rotate-45 animate-pulse" />}
             </div>
             <div className={`w-0 h-0 border-l-[45px] border-l-transparent border-r-[45px] border-r-transparent border-b-[50px] ${unlocked ? 'border-b-green-700' : 'border-b-green-800'} -mt-4 transition-colors relative`}>
                {ornaments.baubles && (
                   <>
                      <div className="absolute top-4 left-[-10px] w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                      <div className="absolute top-8 right-[-5px] w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                   </>
                )}
                {ornaments.tinsel && <div className="absolute top-6 left-[-30px] right-[-30px] h-1 bg-slate-200/50 rounded-full skew-y-6" />}
             </div>
             <div className={`w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[60px] ${unlocked ? 'border-b-green-700' : 'border-b-green-800'} -mt-6 transition-colors relative`}>
                {ornaments.lights && <div className="absolute bottom-4 left-[-40px] w-20 h-1 bg-yellow-300 rounded-full blur-[2px] -rotate-12 animate-pulse" />}
             </div>
             <div className="w-8 h-10 bg-amber-900 rounded-b-lg shadow-inner" />
          </div>

          {/* Presents */}
          {ornaments.presents && (
             <div className="flex gap-1 -mt-2">
                <Gift className="text-red-500" size={16} fill="currentColor" />
                <Gift className="text-blue-500" size={20} fill="currentColor" />
                <Gift className="text-green-500" size={14} fill="currentColor" />
             </div>
          )}
       </div>

       {/* Progress / Unlock Overlay */}
       {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-[2px] rounded-3xl">
             <div className="bg-white/90 p-3 rounded-2xl shadow-xl border border-white flex flex-col items-center text-center max-w-[140px]">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">Tree Progress</h4>
                <div className="flex gap-0.5 my-1">
                   {Object.values(ornaments).map((val, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${val ? 'bg-green-500' : 'bg-slate-200'}`} />
                   ))}
                </div>
                
                {isFullyDecorated ? (
                   <button 
                      onClick={onUnlockSeasonal}
                      disabled={!canAffordUnlock}
                      className={`
                         mt-1 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all
                         ${canAffordUnlock ? 'bg-red-500 text-white hover:bg-red-600 scale-110' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}
                      `}
                   >
                      <Zap size={10} /> Unlock Festive Area (${cost.toLocaleString()})
                   </button>
                ) : (
                   <p className="text-[9px] text-slate-500 italic mt-1 font-medium">Find more ornaments to unlock the Seasonal Area!</p>
                )}
             </div>
          </div>
       )}
       
       {unlocked && (
          <div className="absolute top-0 right-0 pointer-events-none">
             <Sparkles className="text-yellow-400 animate-pulse" size={20} />
          </div>
       )}
    </div>
  );
};