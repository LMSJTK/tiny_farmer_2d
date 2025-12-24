import { GameState, CropType, BuildingType, SpecialBuildingType, SeasonalBuildingType, StorageBuildingType, TransportBuildingType, ManagerStrategy, ManagerState, Stockpile, Plot } from './types';
import {
  CROPS, BUILDINGS, LEVEL_SCALING_FACTOR, BASE_LEVEL_XP,
  MANAGER_LEVEL_BONUS, MANAGER_SPECIALTY_BONUS, STRATEGY_RESIDUE_MONEY_FACTOR, STRATEGY_RESIDUE_MULTIPLIER,
  UPGRADE_SPEED_BONUS, UPGRADE_BULK_BONUS, UPGRADE_EFFICIENCY_BONUS, BASE_STORAGE_CAPACITY
} from './constants';

// Helper to find the effective manager for a plot (either local or remote)
export const getEffectiveManager = (plot: Plot, allPlots: Plot[]): ManagerState | null => {
  // First check if plot has its own manager
  if (plot.manager) return plot.manager;

  // Check if any other plot's manager controls this plot
  for (const otherPlot of allPlots) {
    if (otherPlot.manager && otherPlot.manager.managedPlotIds?.includes(plot.id)) {
      return otherPlot.manager;
    }
  }

  return null;
};

const MAX_LEVEL = 50;

export const getXpForLevel = (level: number) => Math.floor(BASE_LEVEL_XP * Math.pow(LEVEL_SCALING_FACTOR, level - 1));

export const calculateStorageCapacity = (state: GameState): number => {
  let capacity = BASE_STORAGE_CAPACITY;
  for (const plot of state.storagePlots) {
    if (plot.building) {
      const config = BUILDINGS[plot.building];
      if (config?.isStorage && config.storageCapacity) {
        const bulkMult = 1 + ((plot.upgrades.bulk - 1) * UPGRADE_BULK_BONUS);
        capacity += Math.floor(config.storageCapacity * bulkMult);
      }
    }
  }
  return capacity;
};

export const getTotalStockpile = (stockpile: Stockpile): number => {
  return Object.values(stockpile).reduce((sum, count) => sum + count, 0);
};

export const calculateLevelUp = (currentXp: number, currentLevel: number) => {
  let newLevel = currentLevel;
  let xp = currentXp;
  let leveledUp = false;

  while (newLevel < MAX_LEVEL) {
    const required = getXpForLevel(newLevel);
    if (xp >= required) {
      xp -= required;
      newLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }
  return { newLevel, remainingXp: xp, leveledUp };
};

export const processTick = (prevState: GameState, delta: number): GameState => {
  const now = Date.now();

  let moneyGained = 0;
  let xpGained = 0;
  let residueGained = 0;
  let moneySpent = 0;
  let residueConsumed = 0;

  // Track stockpile changes
  const stockpileChanges: Partial<Stockpile> = {};
  const currentStorageCapacity = calculateStorageCapacity(prevState);
  let currentStockpileTotal = getTotalStockpile(prevState.stockpile);

  // --- GLOBAL MULTIPLIERS FROM SPECIAL & SEASONAL BUILDINGS ---
  const activeManors = prevState.specialPlots.filter(p => p.building === SpecialBuildingType.MANOR).length;
  const activeWorkshops = prevState.seasonalPlots.filter(p => p.building === SeasonalBuildingType.SANTAS_WORKSHOP).length;
  const globalMoneyMult = 1 + (activeManors * 0.05) + (activeWorkshops * 0.10);

  const activeAirfields = prevState.specialPlots.filter(p => p.building === SpecialBuildingType.AIRFIELD).length;
  const globalYieldMult = 1 + (activeAirfields * 0.05);

  // 1. Process Crops - harvesting adds to stockpile instead of direct selling
  const newPlots = prevState.plots.map(plot => {
    if (!plot.crop) return plot;

    const cropConfig = CROPS[plot.crop.type];

    let newProgress = plot.crop.progress;
    let isReady = plot.crop.isReady;

    if (!isReady) {
      const progressIncrement = (delta / cropConfig.baseGrowthTimeMs) * 100;
      newProgress = Math.min(100, plot.crop.progress + progressIncrement);
      isReady = newProgress >= 100;
    }

    // Get effective manager (local or remote)
    const effectiveManager = getEffectiveManager(plot, prevState.plots);

    if (effectiveManager && isReady) {
      const currentMoneyEstimate = prevState.money + moneyGained - moneySpent;
      const canAffordReplant = currentMoneyEstimate >= cropConfig.cost;

      // Check if there's room in stockpile
      const hasStorageRoom = currentStockpileTotal < currentStorageCapacity;

      if (canAffordReplant && hasStorageRoom) {
         let yieldMult = (1 + (effectiveManager.level - 1) * MANAGER_LEVEL_BONUS);
         if (effectiveManager.specialty === plot.crop.type) {
           yieldMult += MANAGER_SPECIALTY_BONUS;
         }
         yieldMult *= globalYieldMult;

         let residueMult = 1;
         if (effectiveManager.strategy === ManagerStrategy.RESIDUE) {
            residueMult = STRATEGY_RESIDUE_MULTIPLIER;
         }

         // Add to stockpile instead of selling directly
         const cropType = plot.crop.type;
         stockpileChanges[cropType] = (stockpileChanges[cropType] || 0) + 1;
         currentStockpileTotal += 1;

         // Still gain XP and residue from harvesting
         xpGained += Math.floor(cropConfig.xpReward * yieldMult);
         residueGained += Math.floor(cropConfig.residueReward * yieldMult * residueMult);

         moneySpent += cropConfig.cost;

         return {
           ...plot,
           crop: {
             type: plot.crop.type,
             plantedAt: now,
             progress: 0,
             isReady: false,
             isWithered: false
           }
         };
      }
    }

    return {
      ...plot,
      crop: { ...plot.crop, progress: newProgress, isReady: isReady }
    };
  });

  // 2. Process Buildings (Standard + Special + Seasonal)
  let currentResidueEstimate = prevState.residue + residueGained - residueConsumed;

  const processBuildingList = (plotList: typeof prevState.secondaryPlots) => {
      return plotList.map(bPlot => {
          if (!bPlot.building) return bPlot;
          
          const config = BUILDINGS[bPlot.building];
          if (!config) return bPlot;
          
          let baseResidueInput = config.residueInput;
          let baseMoneyOutput = config.moneyOutput;
          let baseTime = config.processingTimeMs;

          // ** Special Logic: Power Plant / Candy Cane Fab **
          if (bPlot.building === SpecialBuildingType.POWER_PLANT || bPlot.building === SeasonalBuildingType.CANDY_CANE_FACTORY) {
              let totalOutput = 0;
              let hasGenerators = false;

              prevState.secondaryPlots.forEach(p => {
                  if (p.building === BuildingType.GENERATOR) {
                      hasGenerators = true;
                      const genConfig = BUILDINGS[BuildingType.GENERATOR];
                      const pUpgrades = p.upgrades || { speed: 1, bulk: 1, efficiency: 1 };
                      const pBulkMult = 1 + ((pUpgrades.bulk - 1) * UPGRADE_BULK_BONUS);
                      const pEffMult = 1 + ((pUpgrades.efficiency - 1) * UPGRADE_EFFICIENCY_BONUS);
                      
                      totalOutput += Math.floor(genConfig.moneyOutput * pBulkMult * pEffMult);
                  }
              });

              if (!hasGenerators || totalOutput === 0) {
                  return { ...bPlot, progress: 0 }; 
              }

              baseResidueInput = 0; 
              // Candy Cane Fab is more efficient than Omega Plant
              const multiplier = bPlot.building === SeasonalBuildingType.CANDY_CANE_FACTORY ? 1.5 : 1.0;
              baseMoneyOutput = totalOutput * multiplier;
          } else if (config.residueInput === 0 && config.moneyOutput === 0) {
              return bPlot;
          }

          const upgrades = bPlot.upgrades || { speed: 1, bulk: 1, efficiency: 1 };
          const speedMult = 1 + ((upgrades.speed - 1) * UPGRADE_SPEED_BONUS);
          const processingTime = baseTime / speedMult;
          const bulkMult = 1 + ((upgrades.bulk - 1) * UPGRADE_BULK_BONUS);
          const inputRequired = Math.floor(baseResidueInput * bulkMult);
          const efficiencyMult = 1 + ((upgrades.efficiency - 1) * UPGRADE_EFFICIENCY_BONUS);
          const outputAmount = Math.floor(baseMoneyOutput * bulkMult * efficiencyMult);

          if (bPlot.progress > 0) {
              const progressIncrement = (delta / processingTime) * 100;
              const newProgress = bPlot.progress + progressIncrement;
              
              if (newProgress >= 100) {
                  moneyGained += outputAmount;
                  return { ...bPlot, progress: 0 };
              } else {
                  return { ...bPlot, progress: newProgress };
              }
          }
          
          if (bPlot.progress === 0) {
              if (currentResidueEstimate >= inputRequired) {
                  residueConsumed += inputRequired;
                  currentResidueEstimate -= inputRequired;
                  return { ...bPlot, progress: 0.1 };
              }
          }
          
          return bPlot;
      });
  };

  const newSecondaryPlots = processBuildingList(prevState.secondaryPlots);
  const newSpecialPlots = processBuildingList(prevState.specialPlots);
  const newSeasonalPlots = processBuildingList(prevState.seasonalPlots);

  // 3. Process Transport Buildings - sell crops from stockpile
  // Build working stockpile with pending changes
  const workingStockpile: Stockpile = { ...prevState.stockpile };
  for (const [cropType, change] of Object.entries(stockpileChanges)) {
    workingStockpile[cropType as CropType] = (workingStockpile[cropType as CropType] || 0) + (change as number);
  }

  // Track crops sold by transport
  const cropsSold: Partial<Stockpile> = {};

  const newStoragePlots = prevState.storagePlots.map(bPlot => {
    if (!bPlot.building) return bPlot;

    const config = BUILDINGS[bPlot.building];
    if (!config || !config.isTransport) return bPlot;

    const upgrades = bPlot.upgrades || { speed: 1, bulk: 1, efficiency: 1 };
    const speedMult = 1 + ((upgrades.speed - 1) * UPGRADE_SPEED_BONUS);
    const processingTime = config.processingTimeMs / speedMult;
    const bulkMult = 1 + ((upgrades.bulk - 1) * UPGRADE_BULK_BONUS);
    const throughput = Math.floor((config.transportThroughput || 0) * bulkMult);
    const efficiencyMult = 1 + ((upgrades.efficiency - 1) * UPGRADE_EFFICIENCY_BONUS);
    const priceBonus = 1 + (config.transportPriceBonus || 0) * efficiencyMult;

    if (bPlot.progress > 0) {
      const progressIncrement = (delta / processingTime) * 100;
      const newProgress = bPlot.progress + progressIncrement;

      if (newProgress >= 100) {
        // Sell crops from stockpile - prioritize highest value crops
        const cropTypes = Object.values(CropType).sort((a, b) =>
          CROPS[b].sellPrice - CROPS[a].sellPrice
        );

        let cropsToSell = throughput;
        for (const cropType of cropTypes) {
          if (cropsToSell <= 0) break;
          const available = workingStockpile[cropType] || 0;
          const sellCount = Math.min(available, cropsToSell);
          if (sellCount > 0) {
            workingStockpile[cropType] -= sellCount;
            cropsSold[cropType] = (cropsSold[cropType] || 0) + sellCount;
            const cropValue = Math.floor(CROPS[cropType].sellPrice * priceBonus);
            moneyGained += cropValue * sellCount;
            cropsToSell -= sellCount;
          }
        }
        return { ...bPlot, progress: 0 };
      } else {
        return { ...bPlot, progress: newProgress };
      }
    }

    // Start new transport cycle if there are crops to transport
    if (bPlot.progress === 0) {
      const totalCrops = Object.values(workingStockpile).reduce((sum, c) => sum + c, 0);
      if (totalCrops > 0) {
        return { ...bPlot, progress: 0.1 };
      }
    }

    return bPlot;
  });

  // Apply crops sold to stockpile changes
  for (const [cropType, count] of Object.entries(cropsSold)) {
    stockpileChanges[cropType as CropType] = (stockpileChanges[cropType as CropType] || 0) - (count as number);
  }

  moneyGained = Math.floor(moneyGained * globalMoneyMult);

  const netMoneyChange = moneyGained - moneySpent;
  const netResidueChange = residueGained - residueConsumed;
  const { newLevel, remainingXp } = calculateLevelUp(prevState.xp + xpGained, prevState.level);

  // Build final stockpile
  const newStockpile: Stockpile = { ...prevState.stockpile };
  for (const [cropType, change] of Object.entries(stockpileChanges)) {
    newStockpile[cropType as CropType] = Math.max(0, (newStockpile[cropType as CropType] || 0) + (change as number));
  }

  return {
    ...prevState,
    money: prevState.money + netMoneyChange,
    residue: Math.max(0, prevState.residue + netResidueChange),
    xp: remainingXp,
    level: newLevel,
    plots: newPlots,
    secondaryPlots: newSecondaryPlots,
    specialPlots: newSpecialPlots,
    seasonalPlots: newSeasonalPlots,
    storagePlots: newStoragePlots,
    stockpile: newStockpile,
    storageCapacity: currentStorageCapacity,
    lastTick: now
  };
};