import React from 'react';
import { GameState, BuildingConfig, BuildingType, SpecialBuildingType } from '../../types';
import { Lock, Hammer } from 'lucide-react';

interface SidebarBuildingListProps {
  state: GameState;
  buildings: BuildingConfig[];
  activeBuildingSlot: string | null;
  onSelectBuilding: (building: BuildingType | SpecialBuildingType) => void;
}

export const SidebarBuildingList: React.FC<SidebarBuildingListProps> = ({ 
  state, 
  buildings, 
  activeBuildingSlot, 
  onSelectBuilding 
}) => {
  return (
    <div className="space-y-3">
      {activeBuildingSlot && (
        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg mb-4 text-xs text-blue-800 font-medium animate-pulse">
            Select a structure to build.
        </div>
      )}
      
      {buildings.map((building) => {
        const isUnlocked = state.level >= building.unlockLevel;
        const canAfford = state.money >= building.cost;
        
        return (
          <div 
            key={building.id}
            onClick={() => {
                if (isUnlocked && canAfford && activeBuildingSlot) {
                  onSelectBuilding(building.id);
                }
            }}
            className={`
            relative p-3 rounded-xl border-2 transition-all group
            ${isUnlocked 
                ? (activeBuildingSlot)
                ? 'cursor-pointer border-slate-200 hover:border-amber-400 hover:bg-white hover:shadow-md'
                : 'border-slate-100 bg-white opacity-80' 
                : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed grayscale'}
            `}
          >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                <div className="text-3xl bg-slate-50 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                    {building.emoji}
                </div>
                <div>
                    <h3 className="font-bold text-slate-700">{building.name}</h3>
                    <p className="text-[10px] text-slate-500 leading-tight max-w-[140px]">{building.description}</p>
                </div>
                </div>
                <div className="text-right">
                {isUnlocked ? (
                    <div className={`font-bold text-sm ${canAfford ? 'text-slate-700' : 'text-red-500'}`}>
                        ${building.cost}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-full">
                        <Lock size={10} /> Lvl {building.unlockLevel}
                    </div>
                )}
                </div>
            </div>
            
            {/* Base Stats Preview */}
            {building.processingTimeMs > 0 && (
                <div className="mt-2 flex gap-2 text-[10px] font-bold">
                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">-{building.residueInput} Res</span>
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">+${building.moneyOutput}/tick</span>
                </div>
            )}

            {activeBuildingSlot && isUnlocked && canAfford && (
                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                <div className="bg-white text-amber-700 font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Hammer size={12} /> Build
                </div>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};