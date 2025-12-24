import React, { useState } from 'react';
import { GameState, CropType, ManagerStrategy } from '../../types';
import { CROPS, MANAGER_LEVEL_BONUS, MANAGER_TRAINING_BASE_COST, MANAGER_TRAINING_COST_MULT, MANAGER_SPECIALIZE_COST, MANAGER_SPECIALTY_BONUS, getManagerExpandLevel, getManagerExpandCost, MANAGER_MAX_ADDITIONAL_PLOTS } from '../../constants';
import { Button } from '../ui/Button';
import { UserCheck, Zap, Dumbbell, Coins, Leaf, Briefcase, Trash2, ChevronUp, ChevronDown, Globe, Users, Plus, X, Grid3X3 } from 'lucide-react';

interface SidebarManagersProps {
  state: GameState;
  onFireManager: (plotId: string) => void;
  onManagerReplant: (plotId: string, cropType: CropType) => void;
  onSetManagerStrategy: (plotId: string, strategy: ManagerStrategy) => void;
  onTrainManager: (plotId: string) => void;
  onSpecializeManager: (plotId: string, cropType: CropType) => void;
  onGlobalStrategy: (strategy: ManagerStrategy) => void;
  onGlobalReplant: (cropType: CropType) => void;
  onGlobalSpecialize: (cropType: CropType) => void;
  onAssignPlotToManager: (managerPlotId: string, targetPlotId: string) => void;
  onUnassignPlotFromManager: (managerPlotId: string, targetPlotId: string) => void;
}

export const SidebarManagers: React.FC<SidebarManagersProps> = ({
  state,
  onFireManager,
  onManagerReplant,
  onSetManagerStrategy,
  onTrainManager,
  onSpecializeManager,
  onGlobalStrategy,
  onGlobalReplant,
  onGlobalSpecialize,
  onAssignPlotToManager,
  onUnassignPlotFromManager
}) => {
  const [expandedManager, setExpandedManager] = useState<string | null>(null);
  const [showGlobalControls, setShowGlobalControls] = useState(false);
  const [showPlotSelector, setShowPlotSelector] = useState<string | null>(null); // managerPlotId when selecting

  const managedPlots = state.plots.filter(p => p.manager);

  // Get plots that can be assigned to a manager (unlocked, no manager, not already managed)
  const getAssignablePlots = (managerPlotId: string) => {
    const allManagedPlotIds = new Set<string>();
    state.plots.forEach(p => {
      if (p.manager) allManagedPlotIds.add(p.id);
      p.manager?.managedPlotIds?.forEach(id => allManagedPlotIds.add(id));
    });

    return state.plots.filter(p =>
      p.isUnlocked &&
      p.id !== managerPlotId &&
      !allManagedPlotIds.has(p.id)
    );
  };
  const sortedCrops = Object.values(CROPS).sort((a, b) => a.unlockLevel - b.unlockLevel);

  // Helper to extract display number from plot ID (handles both 'plot-5' and 'plot-2-0' formats)
  const getPlotDisplayNumber = (plotId: string): number => {
    const parts = plotId.split('-');
    // For 'plot-5' format: parts = ['plot', '5'], use index 1
    // For 'plot-2-0' format: parts = ['plot', '2', '0'], use last index for plot within area
    if (parts.length === 2) {
      return parseInt(parts[1]) + 1;
    } else {
      // For multi-area plots, show area and plot: "Area 2, Plot 1" would be confusing
      // Instead, calculate overall index: (areaIndex - 1) * plotsPerArea + plotIndex + 1
      const areaIndex = parseInt(parts[1]);
      const plotIndex = parseInt(parts[2]);
      // Assuming 25 plots per field area (PLOTS_PER_FIELD_AREA)
      return (areaIndex - 1) * 25 + plotIndex + 1;
    }
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* GLOBAL CONTROLS SECTION */}
      {managedPlots.length > 0 && (
         <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
             <div 
                className="flex items-center justify-between p-3 cursor-pointer bg-slate-100 hover:bg-slate-200/50"
                onClick={() => setShowGlobalControls(!showGlobalControls)}
             >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                   <Globe size={14} className="text-blue-500" /> Global Operations
                </div>
                {showGlobalControls ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
             </div>

             {showGlobalControls && (
                <div className="p-3 border-t border-slate-200 bg-white space-y-4">
                    
                    {/* Strategy */}
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase">Set All Strategy</label>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" onClick={() => onGlobalStrategy(ManagerStrategy.BALANCED)}>Balanced</Button>
                            <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7" onClick={() => onGlobalStrategy(ManagerStrategy.RESIDUE)}>Biomass</Button>
                        </div>
                    </div>

                    {/* Replant */}
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase">Plant All</label>
                        <div className="grid grid-cols-6 gap-1">
                             {sortedCrops.filter(c => state.level >= c.unlockLevel).map(crop => (
                                <button
                                    key={crop.id}
                                    onClick={() => onGlobalReplant(crop.id)}
                                    className="aspect-square rounded border border-slate-200 hover:border-green-400 hover:bg-green-50 flex items-center justify-center text-sm transition-all"
                                    title={`Plant ${crop.name} everywhere possible`}
                                >
                                    {crop.emoji}
                                </button>
                             ))}
                        </div>
                    </div>

                    {/* Specialize */}
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase">Equip All (${MANAGER_SPECIALIZE_COST})</label>
                        <div className="grid grid-cols-6 gap-1">
                             {sortedCrops.filter(c => state.level >= c.unlockLevel).map(crop => (
                                <button
                                    key={crop.id}
                                    onClick={() => onGlobalSpecialize(crop.id)}
                                    className="aspect-square rounded border border-slate-200 hover:border-amber-400 hover:bg-amber-50 flex items-center justify-center text-lg transition-all"
                                    title={`Equip ${crop.name} Kit on all managers`}
                                >
                                    {crop.emoji}
                                </button>
                             ))}
                        </div>
                    </div>
                </div>
             )}
         </div>
      )}

      {/* MANAGER LIST */}
      {managedPlots.length === 0 ? (
          <div className="text-center text-slate-400 py-10 flex flex-col items-center border-2 border-dashed border-slate-200 rounded-xl">
            <UserCheck className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">No managers hired yet.</p>
            <p className="text-xs opacity-60 mt-1">Hire them from unlocked plots!</p>
          </div>
      ) : (
          managedPlots.map((plot) => {
            const displayIndex = getPlotDisplayNumber(plot.id);
            const isExpanded = expandedManager === plot.id;
            const manager = plot.manager!;
            
            // Calc stats
            const trainingCost = Math.floor(MANAGER_TRAINING_BASE_COST * Math.pow(MANAGER_TRAINING_COST_MULT, manager.level - 1));
            const canAffordTraining = state.money >= trainingCost;
            const canAffordSpecialize = state.money >= MANAGER_SPECIALIZE_COST;

            let currentEfficiency = 100 + ((manager.level - 1) * (MANAGER_LEVEL_BONUS * 100));
            let isSpecialtyActive = false;
            
            if (plot.crop && manager.specialty === plot.crop.type) {
              currentEfficiency += (MANAGER_SPECIALTY_BONUS * 100);
              isSpecialtyActive = true;
            }

            return (
              <div key={plot.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                  {/* Header Row */}
                  <div 
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedManager(isExpanded ? null : plot.id)}
                  >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg relative ${isSpecialtyActive ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300' : 'bg-blue-100 text-blue-600'}`}>
                          <UserCheck size={18} />
                          <div className="absolute -top-1 -right-1 bg-slate-800 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {manager.level}
                          </div>
                        </div>
                        <div>
                            <div className="font-bold text-sm text-slate-700 flex items-center gap-2">
                              Plot #{displayIndex}
                              {isSpecialtyActive && <Zap size={12} className="text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              Yield: <span className={isSpecialtyActive ? 'text-amber-600 font-bold' : 'text-slate-600'}>{currentEfficiency.toFixed(0)}%</span>
                            </div>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-4">
                        
                        {/* 1. Stats & Training */}
                        <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Training Level</div>
                              <div className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                  Lvl {manager.level}
                                  <span className="text-xs font-normal text-green-500 bg-green-50 px-1 rounded">+{Math.round(MANAGER_LEVEL_BONUS*100)}% / lvl</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={canAffordTraining ? 'primary' : 'outline'}
                              disabled={!canAffordTraining}
                              onClick={() => onTrainManager(plot.id)}
                              className="flex flex-col items-center py-1 px-3"
                            >
                              <span className="flex items-center gap-1"><Dumbbell size={12} /> Train</span>
                              <span className="text-[10px] opacity-90">${trainingCost}</span>
                            </Button>
                        </div>

                        {/* Multi-Plot Management */}
                        {(() => {
                          const managedCount = manager.managedPlotIds?.length || 0;
                          const nextSlotNumber = managedCount + 1;
                          const requiredLevel = getManagerExpandLevel(nextSlotNumber);
                          const expandCost = getManagerExpandCost(nextSlotNumber);
                          const canExpand = manager.level >= requiredLevel && managedCount < MANAGER_MAX_ADDITIONAL_PLOTS;
                          const canAffordExpand = state.money >= expandCost;
                          const assignablePlots = getAssignablePlots(plot.id);

                          return (
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                  <Users size={12} /> Multi-Plot Control
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {managedCount}/{MANAGER_MAX_ADDITIONAL_PLOTS} slots
                                </div>
                              </div>

                              {/* Currently managed plots */}
                              {managedCount > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {manager.managedPlotIds?.map(managedId => {
                                    const managedPlot = state.plots.find(p => p.id === managedId);
                                    if (!managedPlot) return null;
                                    const plotNum = getPlotDisplayNumber(managedId);
                                    return (
                                      <div key={managedId} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs">
                                        <Grid3X3 size={10} className="text-blue-400" />
                                        <span className="text-blue-700">Plot #{plotNum}</span>
                                        <button
                                          onClick={() => onUnassignPlotFromManager(plot.id, managedId)}
                                          className="text-blue-400 hover:text-red-500 ml-1"
                                          title="Remove from manager"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Add new plot button or selector */}
                              {managedCount < MANAGER_MAX_ADDITIONAL_PLOTS && (
                                <>
                                  {showPlotSelector === plot.id ? (
                                    <div className="space-y-2">
                                      <div className="text-[10px] text-slate-500 mb-1">Select a plot to assign:</div>
                                      <div className="grid grid-cols-5 gap-1 max-h-24 overflow-y-auto">
                                        {assignablePlots.map(assignable => {
                                          const plotNum = getPlotDisplayNumber(assignable.id);
                                          return (
                                            <button
                                              key={assignable.id}
                                              onClick={() => {
                                                onAssignPlotToManager(plot.id, assignable.id);
                                                setShowPlotSelector(null);
                                              }}
                                              className="aspect-square rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center text-xs font-bold text-slate-600 transition-all"
                                              title={`Assign Plot #${plotNum}`}
                                            >
                                              {plotNum}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {assignablePlots.length === 0 && (
                                        <div className="text-[10px] text-slate-400 text-center py-2">No available plots to assign</div>
                                      )}
                                      <button
                                        onClick={() => setShowPlotSelector(null)}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="text-[10px] text-slate-500">
                                        {canExpand ? (
                                          <>Next slot: <span className="font-bold text-green-600">${expandCost}</span></>
                                        ) : (
                                          <>Requires Lvl {requiredLevel}</>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => canExpand && canAffordExpand && setShowPlotSelector(plot.id)}
                                        disabled={!canExpand || !canAffordExpand}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                                          canExpand && canAffordExpand
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                      >
                                        <Plus size={12} /> Add Plot
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}

                              {managedCount === MANAGER_MAX_ADDITIONAL_PLOTS && (
                                <div className="text-[10px] text-green-600 text-center py-1">Max plots reached!</div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 2. Production Focus (Strategy) - NEW */}
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Production Focus</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                  onClick={() => onSetManagerStrategy(plot.id, ManagerStrategy.BALANCED)}
                                  className={`
                                    flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                                    ${manager.strategy === ManagerStrategy.BALANCED || !manager.strategy 
                                        ? 'bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-300' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}
                                  `}
                              >
                                  <span className="text-xs font-bold mb-1 flex items-center gap-1"><Coins size={12} /> Balanced</span>
                                  <span className="text-[9px]">100% Output</span>
                              </button>
                              
                              <button 
                                  onClick={() => onSetManagerStrategy(plot.id, ManagerStrategy.RESIDUE)}
                                  className={`
                                    flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                                    ${manager.strategy === ManagerStrategy.RESIDUE
                                        ? 'bg-amber-50 border-amber-400 text-amber-700 ring-1 ring-amber-300' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}
                                  `}
                              >
                                  <span className="text-xs font-bold mb-1 flex items-center gap-1"><Leaf size={12} /> Biomass</span>
                                  <span className="text-[9px]">3x Res / -60% $$$</span>
                              </button>
                            </div>
                        </div>

                        {/* 3. Specialization */}
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Equipment Kit</div>
                              <div className="text-[10px] text-amber-600 font-bold">+{MANAGER_SPECIALTY_BONUS * 100}% Yield on Match</div>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-1.5">
                              {/* Generalist Option (Unequip) */}
                              <button
                                  onClick={() => manager.specialty !== null && onSpecializeManager(plot.id, null as any)}
                                  className={`aspect-square rounded flex items-center justify-center border text-xs
                                    ${manager.specialty === null ? 'bg-slate-200 border-slate-400 text-slate-600' : 'bg-white border-slate-200 text-slate-300'}
                                  `}
                                  title="Generalist (No Specialty)"
                                  disabled={true} 
                              >
                                  <Briefcase size={14} />
                              </button>

                              {/* Crop Kits */}
                              {sortedCrops.filter(c => state.level >= c.unlockLevel).map(crop => {
                                  const isEquipped = manager.specialty === crop.id;
                                  return (
                                    <button
                                        key={crop.id}
                                        onClick={() => !isEquipped && canAffordSpecialize && onSpecializeManager(plot.id, crop.id)}
                                        className={`
                                          relative aspect-square rounded flex items-center justify-center border text-lg transition-all
                                          ${isEquipped 
                                              ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-300 text-amber-900 shadow-sm z-10' 
                                              : canAffordSpecialize 
                                                ? 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50' 
                                                : 'bg-slate-50 border-slate-100 opacity-50 grayscale'}
                                        `}
                                        title={`Specialize in ${crop.name} ($${MANAGER_SPECIALIZE_COST})`}
                                        disabled={isEquipped || !canAffordSpecialize}
                                    >
                                        {crop.emoji}
                                        {isEquipped && <div className="absolute -bottom-1 -right-1 bg-amber-500 w-2.5 h-2.5 rounded-full border border-white" />}
                                    </button>
                                  )
                              })}
                            </div>
                            {(!manager.specialty) && (
                                <div className="text-center mt-2 text-[10px] text-slate-400">
                                  Buy a kit for <span className={canAffordSpecialize ? "text-green-600 font-bold" : "text-red-400"}>${MANAGER_SPECIALIZE_COST}</span> to specialize.
                                </div>
                            )}
                        </div>

                        {/* 4. Replant Strategy (Existing) */}
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Replant Crop</div>
                            <div className="grid grid-cols-6 gap-1">
                              {sortedCrops.filter(c => state.level >= c.unlockLevel).map(crop => {
                                  const isActive = plot.crop?.type === crop.id;
                                  const canAfford = state.money >= crop.cost;
                                  const matchesSpecialty = manager.specialty === crop.id;
                                  
                                  return (
                                    <button
                                      key={crop.id}
                                      onClick={() => !isActive && canAfford && onManagerReplant(plot.id, crop.id)}
                                      disabled={isActive || !canAfford}
                                      className={`
                                        aspect-square rounded-md flex items-center justify-center text-sm transition-all border relative
                                        ${isActive 
                                            ? 'bg-green-100 border-green-400 text-green-800' 
                                            : canAfford 
                                              ? 'bg-white border-slate-200 hover:border-green-300' 
                                              : 'bg-slate-50 border-slate-100 opacity-40'}
                                      `}
                                    >
                                        {crop.emoji}
                                        {matchesSpecialty && <div className="absolute -top-1 -right-1"><Zap size={8} className="text-amber-500 fill-amber-500" /></div>}
                                    </button>
                                  )
                              })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex justify-end">
                            <button 
                              onClick={() => onFireManager(plot.id)}
                              className="text-xs text-red-400 hover:text-red-600 underline flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Dismiss Manager
                            </button>
                        </div>
                      </div>
                  )}
              </div>
            );
          })
      )}
    </div>
  );
};