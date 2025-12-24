import React, { useState } from 'react';
import { CropType, GameState, BuildingType, SpecialBuildingType, SeasonalBuildingType, StorageBuildingType, TransportBuildingType, ManagerStrategy } from '../types';
import { BUILDINGS } from '../constants';
import { Sprout, UserCheck, Warehouse, Crown, Zap, Snowflake, Package, LayoutList } from 'lucide-react';
import { SidebarShop } from './sidebar/SidebarShop';
import { SidebarManagers } from './sidebar/SidebarManagers';
import { SidebarBuildingList } from './sidebar/SidebarBuildingList';
import { SidebarManageBuilding } from './sidebar/SidebarManageBuilding';
import { SidebarSeasonal } from './sidebar/SidebarSeasonal';
import { SidebarStock } from './sidebar/SidebarStock';

interface SidebarProps {
  state: GameState;
  onSelectSeed: (seed: CropType) => void;
  onFireManager: (plotId: string) => void;
  onManagerReplant: (plotId: string, cropType: CropType) => void;
  onSetManagerStrategy: (plotId: string, strategy: ManagerStrategy) => void;
  onTrainManager: (plotId: string) => void;
  onSpecializeManager: (plotId: string, cropType: CropType) => void;
  onSelectBuilding: (building: BuildingType | SpecialBuildingType | SeasonalBuildingType | StorageBuildingType | TransportBuildingType) => void;
  onUpgradeBuilding: (plotId: string, upgradeType: 'speed' | 'bulk' | 'efficiency') => void;
  onDemolishBuilding: (plotId: string) => void;
  activeBuildingSlot: string | null;
  onCloseBuildingPanel: () => void;
  onGlobalStrategy: (strategy: ManagerStrategy) => void;
  onGlobalReplant: (cropType: CropType) => void;
  onGlobalSpecialize: (cropType: CropType) => void;
  onSellCrop: (cropType: CropType, amount: number) => void;
  onAssignPlotToManager: (managerPlotId: string, targetPlotId: string) => void;
  onUnassignPlotFromManager: (managerPlotId: string, targetPlotId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onSelectSeed,
  onFireManager,
  onManagerReplant,
  onSetManagerStrategy,
  onTrainManager,
  onSpecializeManager,
  onSelectBuilding,
  onUpgradeBuilding,
  onDemolishBuilding,
  activeBuildingSlot,
  onCloseBuildingPanel,
  onGlobalStrategy,
  onGlobalReplant,
  onGlobalSpecialize,
  onSellCrop,
  onAssignPlotToManager,
  onUnassignPlotFromManager
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'managers' | 'buildings' | 'special' | 'seasonal' | 'storage' | 'stock'>('shop');

  // Calculate total stockpile for badge
  const totalStockpile = state.stockpile ? (Object.values(state.stockpile) as number[]).reduce((sum, c) => sum + c, 0) : 0;

  // Auto-switch tab based on selected slot type
  React.useEffect(() => {
     if (activeBuildingSlot) {
         if (activeBuildingSlot.startsWith('splot')) {
            setActiveTab('special');
         } else if (activeBuildingSlot.startsWith('seplot')) {
            setActiveTab('seasonal');
         } else if (activeBuildingSlot.startsWith('stplot')) {
            setActiveTab('storage');
         } else {
            setActiveTab('buildings');
         }
     }
  }, [activeBuildingSlot]);

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // Explicitly close the building panel to show the list view for that tab
    onCloseBuildingPanel();
  };

  const standardBuildings = Object.values(BUILDINGS).filter(b => !b.isSpecial && !b.isSeasonal && !b.isStorage && !b.isTransport).sort((a, b) => a.unlockLevel - b.unlockLevel) as any;
  const specialBuildings = Object.values(BUILDINGS).filter(b => b.isSpecial).sort((a, b) => a.unlockLevel - b.unlockLevel) as any;
  const seasonalBuildings = Object.values(BUILDINGS).filter(b => b.isSeasonal).sort((a, b) => a.cost - b.cost) as any;
  const storageBuildings = Object.values(BUILDINGS).filter(b => b.isStorage || b.isTransport).sort((a, b) => a.unlockLevel - b.unlockLevel) as any;
  const managedPlots = state.plots.filter(p => p.manager);

  let activeBuildingPlot = activeBuildingSlot ? state.secondaryPlots.find(p => p.id === activeBuildingSlot) : null;
  if (!activeBuildingPlot && activeBuildingSlot) activeBuildingPlot = state.specialPlots.find(p => p.id === activeBuildingSlot);
  if (!activeBuildingPlot && activeBuildingSlot) activeBuildingPlot = state.seasonalPlots.find(p => p.id === activeBuildingSlot);
  if (!activeBuildingPlot && activeBuildingSlot) activeBuildingPlot = state.storagePlots.find(p => p.id === activeBuildingSlot);
  
  const isConstructed = activeBuildingPlot?.building;

  return (
    <div className="bg-white border-t sm:border-t-0 sm:border-l border-slate-200 w-full sm:w-80 h-auto sm:h-[calc(100vh-80px)] overflow-y-auto flex flex-col shadow-xl z-20">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
        <button
          onClick={() => handleTabClick('shop')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'shop' ? 'text-green-600 bg-white border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Seeds"
        >
           <Sprout size={16} />
        </button>
        <button
          onClick={() => handleTabClick('stock')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'stock' ? 'text-orange-600 bg-white border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Stock"
        >
           <LayoutList size={16} /> {totalStockpile > 0 && <span className="text-xs bg-orange-200 text-orange-700 px-1.5 rounded-full">{totalStockpile}</span>}
        </button>
        <button
          onClick={() => handleTabClick('storage')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'storage' ? 'text-amber-600 bg-white border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Storage & Transport"
        >
           <Package size={16} />
        </button>
        <button
          onClick={() => handleTabClick('buildings')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'buildings' ? 'text-green-600 bg-white border-b-2 border-green-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Ranch"
        >
           <Warehouse size={16} />
        </button>
        <button
          onClick={() => handleTabClick('special')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'special' ? 'text-purple-600 bg-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Special"
        >
           <Crown size={16} />
        </button>
        <button 
          onClick={() => handleTabClick('seasonal')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'seasonal' ? 'text-red-600 bg-white border-b-2 border-red-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Seasonal"
        >
           <Snowflake size={16} />
        </button>
        <button 
          onClick={() => handleTabClick('managers')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'managers' ? 'text-blue-600 bg-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
          title="Managers"
        >
           <UserCheck size={16} /> <span className="text-xs bg-slate-200 px-1.5 rounded-full">{managedPlots.length}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        {activeTab === 'shop' && <SidebarShop state={state} onSelectSeed={onSelectSeed} />}
        {activeTab === 'stock' && (
          <div className="p-4">
            <SidebarStock state={state} onSellCrop={onSellCrop} />
          </div>
        )}
        {activeTab === 'managers' && (
          <SidebarManagers
            state={state}
            onFireManager={onFireManager}
            onManagerReplant={onManagerReplant}
            onSetManagerStrategy={onSetManagerStrategy}
            onTrainManager={onTrainManager}
            onSpecializeManager={onSpecializeManager}
            onGlobalStrategy={onGlobalStrategy}
            onGlobalReplant={onGlobalReplant}
            onGlobalSpecialize={onGlobalSpecialize}
            onAssignPlotToManager={onAssignPlotToManager}
            onUnassignPlotFromManager={onUnassignPlotFromManager}
          />
        )}
        {(activeTab === 'buildings' || activeTab === 'special' || activeTab === 'seasonal' || activeTab === 'storage') && (
           <div className="p-4">
              {isConstructed && activeBuildingSlot && activeBuildingPlot ? (
                 <SidebarManageBuilding
                    state={state}
                    activeBuildingSlot={activeBuildingSlot}
                    activeBuildingPlot={activeBuildingPlot}
                    onUpgradeBuilding={onUpgradeBuilding}
                    onDemolishBuilding={onDemolishBuilding}
                    onBack={onCloseBuildingPanel}
                 />
              ) : activeTab === 'seasonal' ? (
                 <SidebarSeasonal
                    state={state}
                    buildings={seasonalBuildings}
                    activeBuildingSlot={activeBuildingSlot}
                    onSelectBuilding={onSelectBuilding as any}
                 />
              ) : (
                 <SidebarBuildingList
                    state={state}
                    buildings={activeTab === 'buildings' ? standardBuildings : activeTab === 'storage' ? storageBuildings : specialBuildings}
                    activeBuildingSlot={activeBuildingSlot}
                    onSelectBuilding={onSelectBuilding as any}
                 />
              )}
           </div>
        )}
      </div>
      
      <div className="mt-auto p-4 bg-yellow-50 border-t border-yellow-100 text-yellow-800 text-xs rounded-t-xl mx-2 mb-2">
        <p className="font-bold mb-1 flex items-center gap-1"><Zap size={12} className="text-yellow-600" /> Pro Tip:</p>
        <p>Decorate the Christmas Tree to unlock Santas Workshop for huge cash bonuses!</p>
      </div>
    </div>
  );
};