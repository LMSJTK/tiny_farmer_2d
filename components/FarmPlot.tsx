import React from 'react';
import { Plot, CropConfig } from '../types';
import { ArrowUpCircle, Lock, Shovel, HardHat, UserCheck } from 'lucide-react';

interface FarmPlotProps {
  plot: Plot;
  cropConfig?: CropConfig;
  onInteract: (plotId: string) => void;
  onUnlock: (plotId: string) => void;
  onHireManager: (plotId: string) => void;
  unlockCost: number;
  managerCost: number;
  canAffordUnlock: boolean;
  canAffordManager: boolean;
  isSelectedSeedAffordable: boolean;
}

export const FarmPlot: React.FC<FarmPlotProps> = ({ 
  plot, 
  cropConfig, 
  onInteract, 
  onUnlock, 
  onHireManager,
  unlockCost,
  managerCost,
  canAffordUnlock,
  canAffordManager,
  isSelectedSeedAffordable
}) => {
  
  // Locked Plot State
  if (!plot.isUnlocked) {
    return (
      <div 
        onClick={() => canAffordUnlock ? onUnlock(plot.id) : null}
        className={`
          aspect-square rounded-2xl flex flex-col items-center justify-center p-2
          border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group
          ${canAffordUnlock 
            ? 'bg-slate-100 border-slate-300 hover:bg-green-50 hover:border-green-400' 
            : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'}
        `}
      >
        <Lock className={`w-6 h-6 mb-1 ${canAffordUnlock ? 'text-green-500' : 'text-slate-400'}`} />
        <span className="text-xs font-bold text-slate-500">${unlockCost}</span>
        
        {canAffordUnlock && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              Buy
            </span>
          </div>
        )}
      </div>
    );
  }

  // Manager Overlay JSX
  // We define this as a variable instead of a nested component to prevent unmounting on every render tick
  const managerOverlay = plot.manager ? (
    <div className="absolute top-1 left-1 z-20" title={`Lvl ${plot.manager.level} Farmhand`}>
       <div className="bg-blue-500 text-white p-1 rounded-lg shadow-sm border border-blue-600 flex items-center gap-0.5">
         <UserCheck size={12} />
         <span className="text-[9px] font-bold">{plot.manager.level}</span>
       </div>
    </div>
  ) : (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        if (canAffordManager) onHireManager(plot.id);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`
        absolute top-1 left-1 z-20 group
        ${canAffordManager ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      <div className={`p-1.5 rounded-lg transition-all ${canAffordManager ? 'bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-500 shadow-sm border border-slate-200' : 'bg-slate-100 text-slate-300'}`}>
        <HardHat size={14} />
      </div>
      
      {/* Hover Hire Tooltip */}
      <div className="hidden group-hover:flex absolute top-full left-0 mt-1 bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded shadow-lg items-center gap-1 z-50 pointer-events-none">
         Hire: <span className={canAffordManager ? 'text-green-400' : 'text-red-400'}>${managerCost}</span>
      </div>
    </div>
  );

  // Unlocked Empty Plot
  if (!plot.crop) {
    return (
      <div 
        onClick={() => onInteract(plot.id)}
        className={`
          aspect-square rounded-2xl flex items-center justify-center relative
          border-b-4 transition-all active:border-b-0 active:translate-y-1 cursor-pointer
          bg-stone-200 border-stone-400 hover:bg-stone-100 group
          ${!isSelectedSeedAffordable ? 'opacity-80' : ''}
        `}
      >
        {managerOverlay}
        
        <div className="text-stone-300 opacity-50">
           <div className="w-8 h-8 rounded-full bg-stone-300/50" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Shovel className={`w-8 h-8 ${isSelectedSeedAffordable ? 'text-stone-500' : 'text-red-400'}`} />
        </div>
      </div>
    );
  }

  // Unlocked Planted Plot
  const isReady = plot.crop.isReady;
  const progressPercent = Math.min(100, plot.crop.progress);
  
  return (
    <div 
      onClick={() => isReady ? onInteract(plot.id) : null}
      className={`
        aspect-square rounded-2xl flex flex-col items-center justify-center relative p-1
        border-b-4 transition-all select-none
        ${isReady 
          ? 'cursor-pointer active:border-b-0 active:translate-y-1 hover:brightness-105 animate-bounce-subtle' 
          : 'cursor-wait'}
        ${cropConfig?.color || 'bg-gray-200'}
      `}
    >
      {managerOverlay}

      {/* Background Progress Fill (Vertical) */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-black/10 transition-all duration-300 ease-linear rounded-b-lg"
        style={{ height: `${progressPercent}%` }}
      />

      <div className={`text-4xl z-10 transition-transform ${isReady ? 'scale-110' : 'scale-90 opacity-80'}`}>
        {cropConfig?.emoji}
      </div>

      {isReady && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-pulse flex items-center gap-1 z-10">
          <ArrowUpCircle size={12} /> Ready
        </div>
      )}
    </div>
  );
};