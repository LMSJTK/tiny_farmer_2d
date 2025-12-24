import React from 'react';
import { GameState, BuildingConfig, SeasonalBuildingType } from '../../types';
import { Lock, Hammer, Snowflake } from 'lucide-react';

interface SidebarSeasonalProps {
  state: GameState;
  buildings: BuildingConfig[];
  activeBuildingSlot: string | null;
  onSelectBuilding: (building: SeasonalBuildingType) => void;
}

export const SidebarSeasonal: React.FC<SidebarSeasonalProps> = ({ 
  state, 
  buildings, 
  activeBuildingSlot, 
  onSelectBuilding 
}) => {
  return (
    <div className="p-4 space-y-4">
      {!state.isSeasonalAreaUnlocked ? (
          <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
             <div className="bg-white p-3 rounded-full text-red-400 shadow-sm border border-red-100">
                <Snowflake size={24} className="animate-spin-slow" />
             </div>
             <h3 className="font-bold text-red-800">Seasonal Locked</h3>
             <p className="text-xs text-red-600 leading-relaxed">Decorate your Christmas Tree in the main farm area to unlock the North Pole annex!</p>
          </div>
      ) : (
         <div className="space-y-3">
            <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider flex items-center gap-2">
               <Snowflake size={14} /> Festive Structures
            </div>
            
            {activeBuildingSlot && (
               <div className="bg-red-50 border border-red-200 p-2 rounded-lg mb-4 text-xs text-red-800 font-medium animate-pulse">
                   Selecting a location at the North Pole...
               </div>
            )}

            {buildings.map((building) => {
               const canAfford = state.money >= building.cost;
               return (
                  <div 
                     key={building.id}
                     onClick={() => {
                         if (canAfford && activeBuildingSlot) {
                           onSelectBuilding(building.id as SeasonalBuildingType);
                         }
                     }}
                     className={`
                        relative p-3 rounded-xl border-2 transition-all group
                        ${activeBuildingSlot
                           ? 'cursor-pointer border-slate-200 hover:border-red-400 hover:bg-white hover:shadow-md'
                           : 'border-slate-100 bg-white opacity-80'}
                        ${!canAfford ? 'opacity-60' : ''}
                     `}
                  >
                     <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                         <div className="text-3xl bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-red-100">
                             {building.emoji}
                         </div>
                         <div>
                             <h3 className="font-bold text-slate-700">{building.name}</h3>
                             <p className="text-[10px] text-slate-500 leading-tight max-w-[140px]">{building.description}</p>
                         </div>
                         </div>
                         <div className="text-right">
                           <div className={`font-bold text-sm ${canAfford ? 'text-slate-700' : 'text-red-500'}`}>
                               ${building.cost.toLocaleString()}
                           </div>
                         </div>
                     </div>

                     {activeBuildingSlot && canAfford && (
                         <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                         <div className="bg-white text-red-700 font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                             <Hammer size={12} /> Build
                         </div>
                         </div>
                     )}
                  </div>
               );
            })}
         </div>
      )}
    </div>
  );
};