import React from 'react';
import { CropType, GameState } from '../../types';
import { CROPS } from '../../constants';
import { Lock } from 'lucide-react';

interface SidebarShopProps {
  state: GameState;
  onSelectSeed: (seed: CropType) => void;
}

export const SidebarShop: React.FC<SidebarShopProps> = ({ state, onSelectSeed }) => {
  const sortedCrops = Object.values(CROPS).sort((a, b) => a.unlockLevel - b.unlockLevel);

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Available Seeds</div>
      {sortedCrops.map((crop) => {
        const isUnlocked = state.level >= crop.unlockLevel;
        const isSelected = state.selectedSeed === crop.id;
        const canAfford = state.money >= crop.cost;

        return (
          <div 
            key={crop.id}
            onClick={() => isUnlocked && onSelectSeed(crop.id)}
            className={`
              relative p-3 rounded-xl border-2 transition-all cursor-pointer group
              ${isSelected 
                ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500 scale-[1.02]' 
                : isUnlocked 
                  ? 'border-slate-100 hover:border-green-300 hover:bg-white hover:shadow-sm' 
                  : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed grayscale'}
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-3xl bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                  {crop.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">{crop.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded text-nowrap">
                      Sell ${crop.sellPrice}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-nowrap">
                      XP {crop.xpReward}
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded text-nowrap">
                      Res {crop.residueReward}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {isUnlocked ? (
                  <div className={`font-bold text-sm ${canAfford ? 'text-slate-700' : 'text-red-500'}`}>
                    ${crop.cost}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-full">
                    <Lock size={10} /> Lvl {crop.unlockLevel}
                  </div>
                )}
                
                {isUnlocked && (
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      {(crop.baseGrowthTimeMs / 1000)}s
                    </div>
                )}
              </div>
            </div>

            {isSelected && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};