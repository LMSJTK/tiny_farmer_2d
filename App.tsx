import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  INITIAL_GAME_STATE, CROPS, BUILDINGS, TICK_RATE_MS,
  PLOT_COST_BASE, PLOT_COST_MULTIPLIER, MANAGER_BASE_COST, MANAGER_COST_GROWTH,
  MANAGER_TRAINING_BASE_COST, MANAGER_TRAINING_COST_MULT,
  MANAGER_SPECIALIZE_COST, MANAGER_SPECIALTY_BONUS,
  SECONDARY_AREA_COST, SECONDARY_AREA_UNLOCK_LEVEL, INITIAL_SECONDARY_PLOTS,
  SPECIAL_AREA_COST, SPECIAL_AREA_UNLOCK_LEVEL, INITIAL_SPECIAL_PLOTS,
  BUILDING_UPGRADE_BASE_COST, BUILDING_UPGRADE_COST_MULT, MANAGER_LEVEL_BONUS,
  ORNAMENT_REQUIREMENTS, SEASONAL_AREA_COST, INITIAL_SEASONAL_PLOTS,
  STORAGE_AREA_COST, STORAGE_AREA_UNLOCK_LEVEL, INITIAL_STORAGE_PLOTS, INITIAL_STOCKPILE, BASE_STORAGE_CAPACITY,
  PLOTS_PER_FIELD_AREA, PLOTS_PER_RANCH_AREA, PLOTS_PER_STORAGE_AREA,
  FIELD_AREA_BASE_COST, FIELD_AREA_COST_MULT,
  RANCH_AREA_BASE_COST, RANCH_AREA_COST_MULT,
  STORAGE_AREA_BASE_COST, STORAGE_AREA_COST_MULT,
  createFieldAreaPlots, createRanchAreaPlots, createStorageAreaPlots,
  getManagerExpandLevel, getManagerExpandCost, MANAGER_MAX_ADDITIONAL_PLOTS
} from './constants';
import { GameState, CropType, BuildingType, SpecialBuildingType, SeasonalBuildingType, StorageBuildingType, TransportBuildingType, ManagerStrategy } from './types';
import { StatsHeader } from './components/StatsHeader';
import { Sidebar } from './components/Sidebar';
import { FarmPlot } from './components/FarmPlot';
import { BuildingPlot } from './components/BuildingPlot';
import { ChristmasTree } from './components/ChristmasTree';
import { WorldAnimations } from './components/WorldAnimations';
import { FarmRoad } from './components/FarmRoad';
import { TycoonWalkway } from './components/TycoonWalkway';
import { AreaHeader } from './components/AreaHeader';
import { Toaster, toast } from 'react-hot-toast';
import { Lock, Bug, Crown, Snowflake, Warehouse } from 'lucide-react';
import { processTick, calculateLevelUp, getXpForLevel } from './gameEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('tiny-farmer-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const plots = parsed.plots?.map((p: any) => {
           if (p.manager) {
              return {
                ...p,
                manager: {
                  ...p.manager,
                  strategy: p.manager.strategy || ManagerStrategy.BALANCED,
                  managedPlotIds: p.manager.managedPlotIds || []
                }
              };
           }
           return p;
        }) || INITIAL_GAME_STATE.plots;
        
        const secondaryPlots = parsed.secondaryPlots?.map((p: any) => ({
           ...p,
           upgrades: p.upgrades || { speed: 1, bulk: 1, efficiency: 1 }
        })) || INITIAL_SECONDARY_PLOTS;
        
        const specialPlots = parsed.specialPlots?.map((p: any) => ({
           ...p,
           upgrades: p.upgrades || { speed: 1, bulk: 1, efficiency: 1 } 
        })) || INITIAL_SPECIAL_PLOTS;

        const seasonalPlots = parsed.seasonalPlots?.map((p: any) => ({
           ...p,
           upgrades: p.upgrades || { speed: 1, bulk: 1, efficiency: 1 }
        })) || INITIAL_SEASONAL_PLOTS;

        const storagePlots = parsed.storagePlots?.map((p: any) => ({
           ...p,
           upgrades: p.upgrades || { speed: 1, bulk: 1, efficiency: 1 }
        })) || INITIAL_STORAGE_PLOTS;

        return {
          ...INITIAL_GAME_STATE,
          ...parsed,
          plots,
          secondaryPlots,
          specialPlots,
          seasonalPlots,
          storagePlots,
          treeOrnaments: parsed.treeOrnaments || INITIAL_GAME_STATE.treeOrnaments,
          stockpile: parsed.stockpile || INITIAL_STOCKPILE,
          storageCapacity: parsed.storageCapacity || BASE_STORAGE_CAPACITY,
          isStorageAreaUnlocked: parsed.isStorageAreaUnlocked || false,
          fieldAreaCount: parsed.fieldAreaCount || 1,
          ranchAreaCount: parsed.ranchAreaCount || 1,
          storageAreaCount: parsed.storageAreaCount || 1,
          lastTick: Date.now()
        };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return INITIAL_GAME_STATE;
  });

  const [activeBuildingSlot, setActiveBuildingSlot] = useState<string | null>(null);

  // Area navigation state
  const [currentFieldArea, setCurrentFieldArea] = useState(1);
  const [currentRanchArea, setCurrentRanchArea] = useState(1);
  const [currentStorageArea, setCurrentStorageArea] = useState(1);

  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('tiny-farmer-save', JSON.stringify(stateRef.current));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, []);

  // Ornament Check Loop
  useEffect(() => {
    const checkOrnaments = setInterval(() => {
      setGameState(prev => {
         const newOrnaments = { ...prev.treeOrnaments };
         let changed = false;

         if (!newOrnaments.baubles && prev.plots.filter(p => p.isUnlocked).length >= ORNAMENT_REQUIREMENTS.baubles.plots) {
            newOrnaments.baubles = true;
            changed = true;
            toast.success("Tree Decorated: Baubles unlocked! 🎄", { icon: '✨' });
         }
         if (!newOrnaments.tinsel && prev.level >= ORNAMENT_REQUIREMENTS.tinsel.level) {
            newOrnaments.tinsel = true;
            changed = true;
            toast.success("Tree Decorated: Tinsel unlocked! 🎄", { icon: '✨' });
         }
         if (!newOrnaments.lights && prev.isSecondaryAreaUnlocked) {
            newOrnaments.lights = true;
            changed = true;
            toast.success("Tree Decorated: Lights unlocked! 🎄", { icon: '✨' });
         }
         if (!newOrnaments.presents && prev.isSpecialAreaUnlocked) {
            newOrnaments.presents = true;
            changed = true;
            toast.success("Tree Decorated: Presents unlocked! 🎄", { icon: '✨' });
         }
         if (!newOrnaments.star && prev.level >= ORNAMENT_REQUIREMENTS.star.level) {
            newOrnaments.star = true;
            changed = true;
            toast.success("Tree Decorated: The Star is unlocked! 🎄", { icon: '⭐' });
         }

         return changed ? { ...prev, treeOrnaments: newOrnaments } : prev;
      });
    }, 2000);
    return () => clearInterval(checkOrnaments);
  }, []);

  const getUnlockCost = useCallback((plotIndex: number) => {
    return Math.floor(PLOT_COST_BASE * Math.pow(PLOT_COST_MULTIPLIER, plotIndex));
  }, []);

  const getManagerCost = useCallback((currentManagerCount: number) => {
    return Math.floor(MANAGER_BASE_COST * Math.pow(MANAGER_COST_GROWTH, currentManagerCount));
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setGameState(prev => processTick(prev, Date.now() - prev.lastTick));
    }, TICK_RATE_MS);
    return () => clearInterval(tick);
  }, []);

  const handleInteract = (plotId: string) => {
    setGameState(prev => {
      const plotIndex = prev.plots.findIndex(p => p.id === plotId);
      if (plotIndex === -1) return prev;
      const plot = prev.plots[plotIndex];
      const activeAirfields = prev.specialPlots.filter(p => p.building === SpecialBuildingType.AIRFIELD).length;
      const globalYieldMult = 1 + (activeAirfields * 0.05);

      if (plot.crop && plot.crop.isReady) {
        // Check storage capacity
        const totalStockpile = Object.values(prev.stockpile).reduce((sum: number, c: number) => sum + c, 0);
        if (totalStockpile >= prev.storageCapacity) {
          toast.error("Storage full! Build more storage buildings.");
          return prev;
        }

        const cropConfig = CROPS[plot.crop.type];
        let yieldMult = 1 + (plot.manager ? (plot.manager.level - 1) * MANAGER_LEVEL_BONUS : 0);
        if (plot.manager?.specialty === plot.crop.type) yieldMult += MANAGER_SPECIALTY_BONUS;
        yieldMult *= globalYieldMult;
        const { newLevel, remainingXp } = calculateLevelUp(prev.xp + Math.floor(cropConfig.xpReward * yieldMult), prev.level);

        // Add to stockpile instead of selling
        const newStockpile = { ...prev.stockpile };
        newStockpile[plot.crop.type] = (newStockpile[plot.crop.type] || 0) + 1;

        return {
          ...prev,
          residue: prev.residue + Math.floor(cropConfig.residueReward * yieldMult),
          xp: remainingXp,
          level: newLevel,
          stockpile: newStockpile,
          plots: prev.plots.map(p => p.id === plotId ? { ...p, crop: null } : p)
        };
      }
      if (!plot.crop) {
        const seedConfig = CROPS[prev.selectedSeed];
        if (prev.money >= seedConfig.cost) {
          return {
            ...prev,
            money: prev.money - seedConfig.cost,
            plots: prev.plots.map(p => p.id === plotId ? { ...p, crop: { type: prev.selectedSeed, plantedAt: Date.now(), progress: 0, isReady: false, isWithered: false } } : p)
          };
        }
      }
      return prev;
    });
  };

  const handleUnlockPlot = (plotId: string) => {
    setGameState(prev => {
      const plotIndex = prev.plots.findIndex(p => p.id === plotId);
      const cost = getUnlockCost(plotIndex);
      if (prev.money >= cost) {
        return { ...prev, money: prev.money - cost, plots: prev.plots.map(p => p.id === plotId ? { ...p, isUnlocked: true } : p) };
      }
      return prev;
    });
  };

  const handleUnlockSecondaryArea = () => {
    setGameState(prev => (prev.money >= SECONDARY_AREA_COST && prev.level >= SECONDARY_AREA_UNLOCK_LEVEL) ? { ...prev, money: prev.money - SECONDARY_AREA_COST, isSecondaryAreaUnlocked: true } : prev);
  };

  const handleUnlockSpecialArea = () => {
    setGameState(prev => (prev.money >= SPECIAL_AREA_COST && prev.level >= SPECIAL_AREA_UNLOCK_LEVEL) ? { ...prev, money: prev.money - SPECIAL_AREA_COST, isSpecialAreaUnlocked: true } : prev);
  };

  const handleUnlockSeasonalArea = () => {
    setGameState(prev => (prev.money >= SEASONAL_AREA_COST) ? { ...prev, money: prev.money - SEASONAL_AREA_COST, isSeasonalAreaUnlocked: true } : prev);
  };

  const handleUnlockStorageArea = () => {
    setGameState(prev => (prev.money >= STORAGE_AREA_COST && prev.level >= STORAGE_AREA_UNLOCK_LEVEL) ? { ...prev, money: prev.money - STORAGE_AREA_COST, isStorageAreaUnlocked: true } : prev);
  };

  // Area expansion handlers
  const getFieldAreaCost = useCallback((areaCount: number) => {
    return Math.floor(FIELD_AREA_BASE_COST * Math.pow(FIELD_AREA_COST_MULT, areaCount - 1));
  }, []);

  const getRanchAreaCost = useCallback((areaCount: number) => {
    return Math.floor(RANCH_AREA_BASE_COST * Math.pow(RANCH_AREA_COST_MULT, areaCount - 1));
  }, []);

  const getStorageAreaCost = useCallback((areaCount: number) => {
    return Math.floor(STORAGE_AREA_BASE_COST * Math.pow(STORAGE_AREA_COST_MULT, areaCount - 1));
  }, []);

  const handleBuyFieldArea = () => {
    setGameState(prev => {
      const cost = getFieldAreaCost(prev.fieldAreaCount + 1);
      if (prev.money < cost) return prev;
      const newPlots = [...prev.plots, ...createFieldAreaPlots(prev.fieldAreaCount + 1)];
      return {
        ...prev,
        money: prev.money - cost,
        fieldAreaCount: prev.fieldAreaCount + 1,
        plots: newPlots
      };
    });
    // Navigate to the new area
    setCurrentFieldArea(gameState.fieldAreaCount + 1);
  };

  const handleBuyRanchArea = () => {
    setGameState(prev => {
      const cost = getRanchAreaCost(prev.ranchAreaCount + 1);
      if (prev.money < cost) return prev;
      const newPlots = [...prev.secondaryPlots, ...createRanchAreaPlots(prev.ranchAreaCount + 1)];
      return {
        ...prev,
        money: prev.money - cost,
        ranchAreaCount: prev.ranchAreaCount + 1,
        secondaryPlots: newPlots
      };
    });
    setCurrentRanchArea(gameState.ranchAreaCount + 1);
  };

  const handleBuyStorageArea = () => {
    setGameState(prev => {
      const cost = getStorageAreaCost(prev.storageAreaCount + 1);
      if (prev.money < cost) return prev;
      const newPlots = [...prev.storagePlots, ...createStorageAreaPlots(prev.storageAreaCount + 1)];
      return {
        ...prev,
        money: prev.money - cost,
        storageAreaCount: prev.storageAreaCount + 1,
        storagePlots: newPlots
      };
    });
    setCurrentStorageArea(gameState.storageAreaCount + 1);
  };

  const handleConstructBuilding = (buildingId: BuildingType | SpecialBuildingType | SeasonalBuildingType | StorageBuildingType | TransportBuildingType) => {
    setGameState(prev => {
       if (!activeBuildingSlot) return prev;
       const config = BUILDINGS[buildingId];
       if (prev.money < config.cost) return prev;

       let updated = false;
       const mapper = (p: any) => p.id === activeBuildingSlot ? (updated = true, { ...p, building: buildingId, upgrades: { speed: 1, bulk: 1, efficiency: 1 } }) : p;

       const newSecondaryPlots = prev.secondaryPlots.map(mapper);
       const newSpecialPlots = updated ? prev.specialPlots : prev.specialPlots.map(mapper);
       const newSeasonalPlots = updated ? prev.seasonalPlots : prev.seasonalPlots.map(mapper);
       const newStoragePlots = updated ? prev.storagePlots : prev.storagePlots.map(mapper);

       return updated ? { ...prev, money: prev.money - config.cost, secondaryPlots: newSecondaryPlots, specialPlots: newSpecialPlots, seasonalPlots: newSeasonalPlots, storagePlots: newStoragePlots } : prev;
    });
  };

  const handleDemolishBuilding = (plotId: string) => {
    setGameState(prev => {
        const mapper = (p: any) => p.id === plotId ? { ...p, building: null, progress: 0, upgrades: { speed: 1, bulk: 1, efficiency: 1 } } : p;
        return { ...prev, secondaryPlots: prev.secondaryPlots.map(mapper), specialPlots: prev.specialPlots.map(mapper), seasonalPlots: prev.seasonalPlots.map(mapper), storagePlots: prev.storagePlots.map(mapper) };
    });
  };

  const handleUpgradeBuilding = (plotId: string, upgradeType: 'speed' | 'bulk' | 'efficiency') => {
    setGameState(prev => {
      const allBuildingPlots = [...prev.secondaryPlots, ...prev.specialPlots, ...prev.seasonalPlots, ...prev.storagePlots];
      const plot = allBuildingPlots.find(p => p.id === plotId);
      if (!plot || !plot.building) return prev;
      const currentLevel = plot.upgrades[upgradeType];
      const cost = Math.floor(BUILDING_UPGRADE_BASE_COST * Math.pow(BUILDING_UPGRADE_COST_MULT, currentLevel - 1));
      if (prev.money < cost) return prev;

      const updatedPlot = { ...plot, upgrades: { ...plot.upgrades, [upgradeType]: currentLevel + 1 } };
      return {
        ...prev,
        money: prev.money - cost,
        secondaryPlots: prev.secondaryPlots.map(p => p.id === plotId ? updatedPlot : p),
        specialPlots: prev.specialPlots.map(p => p.id === plotId ? updatedPlot : p),
        seasonalPlots: prev.seasonalPlots.map(p => p.id === plotId ? updatedPlot : p),
        storagePlots: prev.storagePlots.map(p => p.id === plotId ? updatedPlot : p),
      };
    });
  };

  const handleHireManager = (plotId: string) => {
    setGameState(prev => {
      const currentManagerCount = prev.plots.filter(p => p.manager).length;
      const cost = getManagerCost(currentManagerCount);
      if (prev.money >= cost) {
        return { ...prev, money: prev.money - cost, plots: prev.plots.map(p => p.id === plotId ? { ...p, manager: { id: `mgr-${plotId}-${Date.now()}`, level: 1, specialty: null, strategy: ManagerStrategy.BALANCED, managedPlotIds: [] } } : p) };
      }
      return prev;
    });
  };

  const handleFireManager = (plotId: string) => {
    setGameState(prev => {
      // Also remove this plot from any manager's managedPlotIds
      return {
        ...prev,
        plots: prev.plots.map(p => {
          if (p.id === plotId) {
            return { ...p, manager: null };
          }
          // Remove the fired manager's plot from other managers' lists (in case it was managed)
          if (p.manager?.managedPlotIds?.includes(plotId)) {
            return { ...p, manager: { ...p.manager, managedPlotIds: p.manager.managedPlotIds.filter(id => id !== plotId) } };
          }
          return p;
        })
      };
    });
  };

  const handleAssignPlotToManager = (managerPlotId: string, targetPlotId: string) => {
    setGameState(prev => {
      const managerPlot = prev.plots.find(p => p.id === managerPlotId);
      if (!managerPlot?.manager) return prev;

      const currentManagedCount = managerPlot.manager.managedPlotIds?.length || 0;
      if (currentManagedCount >= MANAGER_MAX_ADDITIONAL_PLOTS) return prev;

      // Check level requirement
      const requiredLevel = getManagerExpandLevel(currentManagedCount + 1);
      if (managerPlot.manager.level < requiredLevel) return prev;

      // Check cost
      const cost = getManagerExpandCost(currentManagedCount + 1);
      if (prev.money < cost) return prev;

      // Check target plot is valid (unlocked, no manager, not already managed)
      const targetPlot = prev.plots.find(p => p.id === targetPlotId);
      if (!targetPlot?.isUnlocked || targetPlot.manager) return prev;

      // Check not already managed by another manager
      const alreadyManaged = prev.plots.some(p =>
        p.manager?.managedPlotIds?.includes(targetPlotId)
      );
      if (alreadyManaged) return prev;

      return {
        ...prev,
        money: prev.money - cost,
        plots: prev.plots.map(p =>
          p.id === managerPlotId
            ? { ...p, manager: { ...p.manager!, managedPlotIds: [...(p.manager!.managedPlotIds || []), targetPlotId] } }
            : p
        )
      };
    });
  };

  const handleUnassignPlotFromManager = (managerPlotId: string, targetPlotId: string) => {
    setGameState(prev => ({
      ...prev,
      plots: prev.plots.map(p =>
        p.id === managerPlotId && p.manager
          ? { ...p, manager: { ...p.manager, managedPlotIds: p.manager.managedPlotIds?.filter(id => id !== targetPlotId) || [] } }
          : p
      )
    }));
  };

  const handleManagerReplant = (plotId: string, cropType: CropType) => {
    setGameState(prev => {
       const cost = CROPS[cropType].cost;
       if (prev.money < cost) return prev;
       return { ...prev, money: prev.money - cost, plots: prev.plots.map(p => p.id === plotId ? { ...p, crop: { type: cropType, plantedAt: Date.now(), progress: 0, isReady: false, isWithered: false } } : p) };
    });
  };

  const handleSetManagerStrategy = (plotId: string, strategy: ManagerStrategy) => {
      setGameState(prev => ({ ...prev, plots: prev.plots.map(p => p.id === plotId ? { ...p, manager: { ...p.manager!, strategy } } : p) }));
  };
  
  const handleTrainManager = (plotId: string) => {
    setGameState(prev => {
       const plot = prev.plots.find(p => p.id === plotId);
       if (!plot?.manager) return prev;
       const cost = Math.floor(MANAGER_TRAINING_BASE_COST * Math.pow(MANAGER_TRAINING_COST_MULT, plot.manager.level - 1));
       if (prev.money >= cost) {
         return { ...prev, money: prev.money - cost, plots: prev.plots.map(p => p.id === plotId ? { ...p, manager: { ...p.manager!, level: p.manager!.level + 1 } } : p) };
       }
       return prev;
    });
  };

  const handleSpecializeManager = (plotId: string, cropType: CropType) => {
     setGameState(prev => (prev.money >= MANAGER_SPECIALIZE_COST) ? { ...prev, money: prev.money - MANAGER_SPECIALIZE_COST, plots: prev.plots.map(p => p.id === plotId ? { ...p, manager: { ...p.manager!, specialty: cropType } } : p) } : prev);
  };

  const handleGlobalStrategy = (strategy: ManagerStrategy) => setGameState(prev => ({ ...prev, plots: prev.plots.map(plot => plot.manager ? { ...plot, manager: { ...plot.manager, strategy } } : plot) }));

  const handleGlobalReplant = (cropType: CropType) => {
     setGameState(prev => {
        let money = prev.money;
        const cost = CROPS[cropType].cost;
        const newPlots = prev.plots.map(plot => {
           if (plot.manager && plot.crop?.type !== cropType && money >= cost) {
               money -= cost;
               return { ...plot, crop: { type: cropType, plantedAt: Date.now(), progress: 0, isReady: false, isWithered: false } };
           }
           return plot;
        });
        return { ...prev, money, plots: newPlots };
     });
  };

  const handleGlobalSpecialize = (cropType: CropType) => {
     setGameState(prev => {
        let money = prev.money;
        const cost = MANAGER_SPECIALIZE_COST;
        const newPlots = prev.plots.map(plot => {
           if (plot.manager && plot.manager.specialty !== cropType && money >= cost) {
               money -= cost;
               return { ...plot, manager: { ...plot.manager, specialty: cropType } };
           }
           return plot;
        });
        return { ...prev, money, plots: newPlots };
     });
  };

  const handleSelectSeed = (seed: CropType) => setGameState(prev => ({ ...prev, selectedSeed: seed }));

  const MANUAL_SELL_PENALTY = 0.75; // 75% of normal price for manual sales

  const handleManualSell = () => {
    setGameState(prev => {
      // Find highest value crop in stockpile
      const cropTypes = Object.values(CropType).sort((a, b) =>
        CROPS[b].sellPrice - CROPS[a].sellPrice
      );

      for (const cropType of cropTypes) {
        const count = prev.stockpile[cropType] || 0;
        if (count > 0) {
          const sellPrice = Math.floor(CROPS[cropType].sellPrice * MANUAL_SELL_PENALTY);
          const newStockpile = { ...prev.stockpile };
          newStockpile[cropType] = count - 1;
          return {
            ...prev,
            money: prev.money + sellPrice,
            stockpile: newStockpile
          };
        }
      }
      return prev;
    });
  };

  const handleSellCrop = (cropType: CropType, amount: number) => {
    setGameState(prev => {
      const currentCount = prev.stockpile[cropType] || 0;
      const sellAmount = Math.min(amount, currentCount);
      if (sellAmount <= 0) return prev;

      const sellPrice = Math.floor(CROPS[cropType].sellPrice * MANUAL_SELL_PENALTY);
      const totalMoney = sellPrice * sellAmount;

      const newStockpile = { ...prev.stockpile };
      newStockpile[cropType] = currentCount - sellAmount;

      return {
        ...prev,
        money: prev.money + totalMoney,
        stockpile: newStockpile
      };
    });
  };

  const handleCheat = () => {
    setGameState(prev => {
       let xp = prev.xp;
       for (let i = 0; i < 20; i++) xp += getXpForLevel(prev.level + i);
       return { ...prev, money: prev.money + 500000, xp: xp, level: prev.level + 20 };
    });
  };

  const xpToNext = getXpForLevel(gameState.level);
  const selectedSeedCost = CROPS[gameState.selectedSeed].cost;
  const managerCount = gameState.plots.filter(p => p.manager).length;
  const nextManagerCost = getManagerCost(managerCount);

  // Calculate plots for current area
  const fieldStartIndex = (currentFieldArea - 1) * PLOTS_PER_FIELD_AREA;
  const currentFieldPlots = gameState.plots.slice(fieldStartIndex, fieldStartIndex + PLOTS_PER_FIELD_AREA);
  const plotsTop = currentFieldPlots.slice(0, 10);
  const plotsBottom = currentFieldPlots.slice(10);

  // Calculate plots for current ranch area
  const ranchStartIndex = (currentRanchArea - 1) * PLOTS_PER_RANCH_AREA;
  const currentRanchPlots = gameState.secondaryPlots.slice(ranchStartIndex, ranchStartIndex + PLOTS_PER_RANCH_AREA);

  // Calculate plots for current storage area
  const storageStartIndex = (currentStorageArea - 1) * PLOTS_PER_STORAGE_AREA;
  const currentStoragePlots = gameState.storagePlots.slice(storageStartIndex, storageStartIndex + PLOTS_PER_STORAGE_AREA);

  // Area costs
  const nextFieldAreaCost = getFieldAreaCost(gameState.fieldAreaCount + 1);
  const nextRanchAreaCost = getRanchAreaCost(gameState.ranchAreaCount + 1);
  const nextStorageAreaCost = getStorageAreaCost(gameState.storageAreaCount + 1);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden relative">
      <StatsHeader state={gameState} xpToNextLevel={xpToNext} onManualSell={handleManualSell} />
      <Toaster position="bottom-center" />

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-green-100 relative">
          
          {/* --- World Animations Layer --- */}
          <WorldAnimations state={gameState} />

          <div className="max-w-5xl mx-auto space-y-12 relative z-10">
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* FARM PLOTS */}
               <div className="flex-1">
                  <div className="bg-green-100 rounded-t-2xl overflow-hidden mb-4">
                    <AreaHeader
                      title="Farming Fields"
                      emoji="🚜"
                      currentArea={currentFieldArea}
                      totalAreas={gameState.fieldAreaCount}
                      onPrevArea={() => setCurrentFieldArea(prev => Math.max(1, prev - 1))}
                      onNextArea={() => setCurrentFieldArea(prev => Math.min(gameState.fieldAreaCount, prev + 1))}
                      onBuyNewArea={handleBuyFieldArea}
                      newAreaCost={nextFieldAreaCost}
                      canAffordNewArea={gameState.money >= nextFieldAreaCost}
                      currentLevel={gameState.level}
                      bgColor="bg-green-100"
                      textColor="text-green-700"
                    />
                  </div>

                  {/* Top Half of Plots */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                     {plotsTop.map((plot, index) => (
                       <FarmPlot 
                         key={plot.id}
                         plot={plot}
                         cropConfig={plot.crop ? CROPS[plot.crop.type] : undefined}
                         onInteract={handleInteract}
                         onUnlock={handleUnlockPlot}
                         onHireManager={handleHireManager}
                         unlockCost={getUnlockCost(index)}
                         managerCost={nextManagerCost}
                         canAffordUnlock={gameState.money >= getUnlockCost(index)}
                         canAffordManager={gameState.money >= nextManagerCost}
                         isSelectedSeedAffordable={gameState.money >= selectedSeedCost}
                       />
                     ))}
                  </div>

                  {/* ROAD */}
                  <FarmRoad />

                  {/* Bottom Half of Plots */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                     {plotsBottom.map((plot, index) => {
                       const realIndex = index + 10;
                       return (
                        <FarmPlot 
                          key={plot.id}
                          plot={plot}
                          cropConfig={plot.crop ? CROPS[plot.crop.type] : undefined}
                          onInteract={handleInteract}
                          onUnlock={handleUnlockPlot}
                          onHireManager={handleHireManager}
                          unlockCost={getUnlockCost(realIndex)}
                          managerCost={nextManagerCost}
                          canAffordUnlock={gameState.money >= getUnlockCost(realIndex)}
                          canAffordManager={gameState.money >= nextManagerCost}
                          isSelectedSeedAffordable={gameState.money >= selectedSeedCost}
                        />
                       );
                     })}
                  </div>
               </div>

               {/* CHRISTMAS TREE (Visual Landmark) */}
               <div className="bg-white/50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center shadow-inner self-center md:self-start backdrop-blur-sm">
                  <ChristmasTree 
                     ornaments={gameState.treeOrnaments} 
                     unlocked={gameState.isSeasonalAreaUnlocked} 
                     onUnlockSeasonal={handleUnlockSeasonalArea}
                     canAffordUnlock={gameState.money >= SEASONAL_AREA_COST}
                     cost={SEASONAL_AREA_COST}
                  />
                  <div className="mt-4 text-center">
                     <h3 className="text-sm font-bold text-slate-700">Festive Fir</h3>
                     <p className="text-[10px] text-slate-500 max-w-[120px]">Ornaments: {Object.values(gameState.treeOrnaments).filter(Boolean).length}/5</p>
                  </div>
               </div>
            </div>

            {/* STORAGE & TRANSPORT AREA */}
            <div className="relative">
               {!gameState.isStorageAreaUnlocked ? (
                  <>
                    <h2 className="text-xl font-bold text-amber-700 mb-4 flex items-center gap-2"><span>📦</span> Storage & Transport</h2>
                    <div className="bg-amber-50 border-4 border-dashed border-amber-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4">
                        <div className="bg-white p-4 rounded-full shadow-sm text-amber-400"><Warehouse size={32} /></div>
                        <div><h3 className="text-lg font-bold text-amber-800">Storage Hub</h3><p className="text-amber-600 max-w-md">Build storage to stockpile crops and transport to sell them!</p></div>
                        <button onClick={handleUnlockStorageArea} disabled={gameState.level < STORAGE_AREA_UNLOCK_LEVEL || gameState.money < STORAGE_AREA_COST} className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${gameState.level >= STORAGE_AREA_UNLOCK_LEVEL && gameState.money >= STORAGE_AREA_COST ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>Unlock for ${STORAGE_AREA_COST}</button>
                    </div>
                  </>
               ) : (
                  <>
                    <div className="bg-amber-100 rounded-t-2xl overflow-hidden mb-4">
                      <AreaHeader
                        title="Storage & Transport"
                        emoji="📦"
                        currentArea={currentStorageArea}
                        totalAreas={gameState.storageAreaCount}
                        onPrevArea={() => setCurrentStorageArea(prev => Math.max(1, prev - 1))}
                        onNextArea={() => setCurrentStorageArea(prev => Math.min(gameState.storageAreaCount, prev + 1))}
                        onBuyNewArea={handleBuyStorageArea}
                        newAreaCost={nextStorageAreaCost}
                        canAffordNewArea={gameState.money >= nextStorageAreaCost}
                        currentLevel={gameState.level}
                        bgColor="bg-amber-100"
                        textColor="text-amber-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {currentStoragePlots.map((plot) => <div key={plot.id} className={activeBuildingSlot === plot.id ? 'ring-4 ring-amber-400 rounded-2xl' : ''}><BuildingPlot plot={plot} onConstruct={() => setActiveBuildingSlot(plot.id)}/></div>)}
                    </div>
                  </>
               )}
            </div>

            {/* RANCH AREA */}
            <div className="relative">
               {!gameState.isSecondaryAreaUnlocked ? (
                  <>
                    <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><span>🏭</span> Ranch Area</h2>
                    <div className="bg-slate-200/50 border-4 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4">
                        <div className="bg-white p-4 rounded-full shadow-sm text-slate-400"><Lock size={32} /></div>
                        <div><h3 className="text-lg font-bold text-slate-600">Area Locked</h3><p className="text-slate-500 max-w-md">Unlock the Ranch to process residue.</p></div>
                        <button onClick={handleUnlockSecondaryArea} disabled={gameState.level < SECONDARY_AREA_UNLOCK_LEVEL || gameState.money < SECONDARY_AREA_COST} className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${gameState.level >= SECONDARY_AREA_UNLOCK_LEVEL && gameState.money >= SECONDARY_AREA_COST ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>Unlock for ${SECONDARY_AREA_COST}</button>
                    </div>
                  </>
               ) : (
                  <>
                    <div className="bg-slate-200 rounded-t-2xl overflow-hidden mb-4">
                      <AreaHeader
                        title="Ranch Area"
                        emoji="🏭"
                        currentArea={currentRanchArea}
                        totalAreas={gameState.ranchAreaCount}
                        onPrevArea={() => setCurrentRanchArea(prev => Math.max(1, prev - 1))}
                        onNextArea={() => setCurrentRanchArea(prev => Math.min(gameState.ranchAreaCount, prev + 1))}
                        onBuyNewArea={handleBuyRanchArea}
                        newAreaCost={nextRanchAreaCost}
                        canAffordNewArea={gameState.money >= nextRanchAreaCost}
                        currentLevel={gameState.level}
                        bgColor="bg-slate-200"
                        textColor="text-slate-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       {currentRanchPlots.map((plot) => <div key={plot.id} className={activeBuildingSlot === plot.id ? 'ring-4 ring-blue-400 rounded-2xl' : ''}><BuildingPlot plot={plot} onConstruct={() => setActiveBuildingSlot(plot.id)}/></div>)}
                    </div>
                  </>
               )}
            </div>

            {/* SPECIAL AREA */}
            <div className="relative">
               <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><span>👑</span> Tycoon's Estate</h2>
               {!gameState.isSpecialAreaUnlocked ? (
                  <div className="bg-purple-100/50 border-4 border-dashed border-purple-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4">
                      <div className="bg-white p-4 rounded-full shadow-sm text-purple-400"><Crown size={32} /></div>
                      <div><h3 className="text-lg font-bold text-purple-800">Special Annex</h3><p className="text-purple-600 max-w-md">Build high-end passive structures.</p></div>
                      <button onClick={handleUnlockSpecialArea} disabled={gameState.level < SPECIAL_AREA_UNLOCK_LEVEL || gameState.money < SPECIAL_AREA_COST} className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${gameState.level >= SPECIAL_AREA_UNLOCK_LEVEL && gameState.money >= SPECIAL_AREA_COST ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>Unlock for ${SPECIAL_AREA_COST}</button>
                  </div>
               ) : (
                  <>
                     <TycoonWalkway activeSlot={activeBuildingSlot} />
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {gameState.specialPlots.map((plot) => <div key={plot.id} className={activeBuildingSlot === plot.id ? 'ring-4 ring-purple-400 rounded-2xl' : ''}><BuildingPlot plot={plot} onConstruct={() => setActiveBuildingSlot(plot.id)}/></div>)}
                     </div>
                  </>
               )}
            </div>

            {/* SEASONAL AREA */}
            <div className="pb-24 relative">
               <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2"><span>❄️</span> Seasonal: North Pole</h2>
               {!gameState.isSeasonalAreaUnlocked ? (
                  <div className="bg-red-50 border-4 border-dashed border-red-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4">
                      <div className="bg-white p-4 rounded-full shadow-sm text-red-400"><Snowflake size={32} /></div>
                      <div><h3 className="text-lg font-bold text-red-800">North Pole Annex</h3><p className="text-red-600 max-w-md">Unlock by decorating the festive fir tree with all ornaments!</p></div>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                     {gameState.seasonalPlots.map((plot) => <div key={plot.id} className={activeBuildingSlot === plot.id ? 'ring-4 ring-red-400 rounded-2xl' : ''}><BuildingPlot plot={plot} onConstruct={() => setActiveBuildingSlot(plot.id)}/></div>)}
                  </div>
               )}
            </div>
            
          </div>
        </main>

        <div className="hidden sm:block shadow-2xl">
           <Sidebar
              state={gameState}
              onSelectSeed={handleSelectSeed}
              onFireManager={handleFireManager}
              onManagerReplant={handleManagerReplant}
              onSetManagerStrategy={handleSetManagerStrategy}
              onTrainManager={handleTrainManager}
              onSpecializeManager={handleSpecializeManager}
              onSelectBuilding={handleConstructBuilding}
              onUpgradeBuilding={handleUpgradeBuilding}
              onDemolishBuilding={handleDemolishBuilding}
              activeBuildingSlot={activeBuildingSlot}
              onCloseBuildingPanel={() => setActiveBuildingSlot(null)}
              onGlobalStrategy={handleGlobalStrategy}
              onGlobalReplant={handleGlobalReplant}
              onGlobalSpecialize={handleGlobalSpecialize}
              onSellCrop={handleSellCrop}
              onAssignPlotToManager={handleAssignPlotToManager}
              onUnassignPlotFromManager={handleUnassignPlotFromManager}
           />
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 h-[30vh] overflow-y-auto">
         <Sidebar state={gameState} onSelectSeed={handleSelectSeed} onFireManager={handleFireManager} onManagerReplant={handleManagerReplant} onSetManagerStrategy={handleSetManagerStrategy} onTrainManager={handleTrainManager} onSpecializeManager={handleSpecializeManager} onSelectBuilding={handleConstructBuilding} onUpgradeBuilding={handleUpgradeBuilding} onDemolishBuilding={handleDemolishBuilding} activeBuildingSlot={activeBuildingSlot} onCloseBuildingPanel={() => setActiveBuildingSlot(null)} onGlobalStrategy={handleGlobalStrategy} onGlobalReplant={handleGlobalReplant} onGlobalSpecialize={handleGlobalSpecialize} onSellCrop={handleSellCrop} onAssignPlotToManager={handleAssignPlotToManager} onUnassignPlotFromManager={handleUnassignPlotFromManager} />
      </div>

      <button onClick={handleCheat} className="absolute bottom-4 right-4 z-50 bg-slate-800 text-white p-2 rounded-full shadow-lg opacity-20 hover:opacity-100 transition-opacity" title="DEV: Cheat"><Bug size={16} /></button>
    </div>
  );
};

export default App;