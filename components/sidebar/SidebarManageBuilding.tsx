import React from 'react';
import { GameState, BuildingPlotState, BuildingType, SpecialBuildingType } from '../../types';
import { BUILDINGS, BUILDING_UPGRADE_BASE_COST, BUILDING_UPGRADE_COST_MULT, UPGRADE_SPEED_BONUS, UPGRADE_BULK_BONUS, UPGRADE_EFFICIENCY_BONUS } from '../../constants';
import { Button } from '../ui/Button';
import { Trash2, FastForward, Boxes, Coins, ArrowUp, ArrowLeft } from 'lucide-react';

interface SidebarManageBuildingProps {
  state: GameState;
  activeBuildingSlot: string;
  activeBuildingPlot: BuildingPlotState;
  onUpgradeBuilding: (plotId: string, upgradeType: 'speed' | 'bulk' | 'efficiency') => void;
  onDemolishBuilding: (plotId: string) => void;
  onBack?: () => void;
}

export const SidebarManageBuilding: React.FC<SidebarManageBuildingProps> = ({
  state,
  activeBuildingSlot,
  activeBuildingPlot,
  onUpgradeBuilding,
  onDemolishBuilding,
  onBack
}) => {
  
  if (!activeBuildingPlot.building) return null;
  const config = BUILDINGS[activeBuildingPlot.building];

  // Helper to calculate real stats
  const getRealStats = () => {
    let baseInput = config.residueInput;
    let baseOutput = config.moneyOutput;
    
    // Dynamic Power Plant Logic for display
    if (activeBuildingPlot.building === SpecialBuildingType.POWER_PLANT) {
        let totalOutput = 0;
        state.secondaryPlots.forEach(p => {
            if (p.building === BuildingType.GENERATOR) {
                const genConfig = BUILDINGS[BuildingType.GENERATOR];
                const pUpgrades = p.upgrades || { speed: 1, bulk: 1, efficiency: 1 };
                const pBulkMult = 1 + ((pUpgrades.bulk - 1) * UPGRADE_BULK_BONUS);
                const pEffMult = 1 + ((pUpgrades.efficiency - 1) * UPGRADE_EFFICIENCY_BONUS);
                
                totalOutput += Math.floor(genConfig.moneyOutput * pBulkMult * pEffMult);
            }
        });
        baseInput = 0; // Explicitly 0
        baseOutput = totalOutput;
    }

    const upgrades = activeBuildingPlot.upgrades;
    const speedMult = 1 + ((upgrades.speed - 1) * UPGRADE_SPEED_BONUS);
    const bulkMult = 1 + ((upgrades.bulk - 1) * UPGRADE_BULK_BONUS);
    const efficiencyMult = 1 + ((upgrades.efficiency - 1) * UPGRADE_EFFICIENCY_BONUS);

    return {
        time: config.processingTimeMs > 0 ? (config.processingTimeMs / speedMult) / 1000 : 0,
        input: Math.floor(baseInput * bulkMult),
        output: Math.floor(baseOutput * bulkMult * efficiencyMult)
    };
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                  {onBack && (
                    <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                  )}
                  <div className="text-4xl">{config.emoji}</div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-700">{config.name}</h3>
                      <p className="text-xs text-slate-400">Manage Upgrades</p>
                  </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => onDemolishBuilding(activeBuildingSlot)} className="px-2">
                  <Trash2 size={14} />
              </Button>
          </div>
          
          {/* Current Stats Panel */}
          <div className="bg-slate-50 p-3 rounded-lg mb-4 grid grid-cols-3 gap-2 text-center">
              {(() => {
                  const realStats = getRealStats();
                  return (
                      <>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Input</div>
                            <div className="text-sm font-bold text-slate-700">{realStats.input} <span className="text-[10px] font-normal text-amber-500">Res</span></div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Output</div>
                            <div className="text-sm font-bold text-slate-700">${realStats.output}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Speed</div>
                            <div className="text-sm font-bold text-slate-700">{realStats.time > 0 ? realStats.time.toFixed(1) + 's' : 'Passive'}</div>
                        </div>
                      </>
                  )
              })()}
          </div>

          {/* Upgrade Cards */}
          {[
            { 
              id: 'speed', 
              label: 'Speed', 
              icon: <FastForward size={14} />, 
              desc: `-${Math.round((1 - (1/(1+UPGRADE_SPEED_BONUS))) * 100)}% Time`, 
              level: activeBuildingPlot.upgrades.speed 
            },
            { 
              id: 'bulk', 
              label: 'Throughput', 
              icon: <Boxes size={14} />, 
              desc: `+${Math.round(UPGRADE_BULK_BONUS*100)}% Input/Output`, 
              level: activeBuildingPlot.upgrades.bulk 
            },
            { 
              id: 'efficiency', 
              label: 'Efficiency', 
              icon: <Coins size={14} />, 
              desc: `+${Math.round(UPGRADE_EFFICIENCY_BONUS*100)}% Value`, 
              level: activeBuildingPlot.upgrades.efficiency 
            },
          ].map((u) => {
            const cost = Math.floor(BUILDING_UPGRADE_BASE_COST * Math.pow(BUILDING_UPGRADE_COST_MULT, u.level - 1));
            const canAfford = state.money >= cost;
            
            return (
              <div key={u.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg mb-2">
                  <div>
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      {u.icon} {u.label} <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 rounded-full">Lvl {u.level}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{u.desc}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={canAfford ? 'primary' : 'outline'} 
                    disabled={!canAfford}
                    onClick={() => onUpgradeBuilding(activeBuildingSlot, u.id as any)}
                    className="h-8"
                  >
                    <ArrowUp size={12} className="mr-1"/> ${cost}
                  </Button>
              </div>
            );
          })}
      </div>
      {!onBack && <div className="text-center text-xs text-slate-400">Select another slot to close</div>}
    </div>
  );
};