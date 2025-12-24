import { CropConfig, CropType, GameState, Plot, BuildingConfig, BuildingType, BuildingPlotState, ManagerStrategy, SpecialBuildingType, SeasonalBuildingType, StorageBuildingType, TransportBuildingType, Stockpile } from './types';

export const LEVEL_SCALING_FACTOR = 1.5;
export const BASE_LEVEL_XP = 100;
export const TICK_RATE_MS = 100;

export const STRATEGY_RESIDUE_MULTIPLIER = 3.0;
export const STRATEGY_RESIDUE_MONEY_FACTOR = 0.4;

export const BUILDING_UPGRADE_BASE_COST = 500;
export const BUILDING_UPGRADE_COST_MULT = 1.6;

export const UPGRADE_SPEED_BONUS = 0.1;
export const UPGRADE_BULK_BONUS = 0.5;
export const UPGRADE_EFFICIENCY_BONUS = 0.2;

export const CROPS: Record<CropType, CropConfig> = {
  [CropType.WHEAT]: {
    id: CropType.WHEAT,
    name: 'Wheat',
    emoji: '🌾',
    baseGrowthTimeMs: 2000,
    sellPrice: 3,
    cost: 1,
    xpReward: 2,
    residueReward: 2,
    unlockLevel: 1,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  },
  [CropType.CORN]: {
    id: CropType.CORN,
    name: 'Corn',
    emoji: '🌽',
    baseGrowthTimeMs: 5000,
    sellPrice: 12,
    cost: 4,
    xpReward: 5,
    residueReward: 4,
    unlockLevel: 2,
    color: 'bg-yellow-200 border-yellow-400 text-yellow-800',
  },
  [CropType.CARROT]: {
    id: CropType.CARROT,
    name: 'Carrot',
    emoji: '🥕',
    baseGrowthTimeMs: 10000,
    sellPrice: 30,
    cost: 10,
    xpReward: 12,
    residueReward: 3,
    unlockLevel: 4,
    color: 'bg-orange-100 border-orange-300 text-orange-700',
  },
  [CropType.TOMATO]: {
    id: CropType.TOMATO,
    name: 'Tomato',
    emoji: '🍅',
    baseGrowthTimeMs: 20000,
    sellPrice: 75,
    cost: 25,
    xpReward: 30,
    residueReward: 5,
    unlockLevel: 6,
    color: 'bg-red-100 border-red-300 text-red-700',
  },
  [CropType.PUMPKIN]: {
    id: CropType.PUMPKIN,
    name: 'Pumpkin',
    emoji: '🎃',
    baseGrowthTimeMs: 45000,
    sellPrice: 180,
    cost: 60,
    xpReward: 75,
    residueReward: 10,
    unlockLevel: 10,
    color: 'bg-orange-200 border-orange-500 text-orange-900',
  },
  [CropType.STRAWBERRY]: {
    id: CropType.STRAWBERRY,
    name: 'Berry',
    emoji: '🍓',
    baseGrowthTimeMs: 120000,
    sellPrice: 500,
    cost: 150,
    xpReward: 200,
    residueReward: 8,
    unlockLevel: 15,
    color: 'bg-pink-100 border-pink-300 text-pink-700',
  },
};

export const BUILDINGS: Record<BuildingType | SpecialBuildingType | SeasonalBuildingType | StorageBuildingType | TransportBuildingType, BuildingConfig> = {
  [BuildingType.COMPOSTER]: {
    id: BuildingType.COMPOSTER,
    name: 'Composter',
    emoji: '♻️',
    description: 'Slowly turns residue into fertilizer.',
    cost: 250,
    residueInput: 10, 
    moneyOutput: 25,
    processingTimeMs: 3000,
    unlockLevel: 2,
  },
  [BuildingType.COOP]: {
    id: BuildingType.COOP,
    name: 'Chicken Coop',
    emoji: '🐔',
    description: 'Chickens peck at residue to lay eggs.',
    cost: 1000,
    residueInput: 25,
    moneyOutput: 80,
    processingTimeMs: 5000,
    unlockLevel: 5,
  },
  [BuildingType.GENERATOR]: {
    id: BuildingType.GENERATOR,
    name: 'Bio Generator',
    emoji: '⚡',
    description: 'Incinerates massive amounts of biomass.',
    cost: 5000,
    residueInput: 100,
    moneyOutput: 400,
    processingTimeMs: 10000,
    unlockLevel: 12,
  },
  [SpecialBuildingType.MANOR]: {
    id: SpecialBuildingType.MANOR,
    name: 'Manor House',
    emoji: '🏰',
    description: '+5% to all Cash gains (Investments).',
    cost: 50000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 15,
    isSpecial: true
  },
  [SpecialBuildingType.AIRFIELD]: {
    id: SpecialBuildingType.AIRFIELD,
    name: 'Crop Airfield',
    emoji: '✈️',
    description: '+5% to all Yields (Crop & Residue).',
    cost: 100000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 20,
    isSpecial: true
  },
  [SpecialBuildingType.POWER_PLANT]: {
    id: SpecialBuildingType.POWER_PLANT,
    name: 'Omega Plant',
    emoji: '🏭',
    description: 'Generates free power from Bio Generators. Slow cycle.',
    cost: 500000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 60000,
    unlockLevel: 30,
    isSpecial: true
  },
  [SeasonalBuildingType.SANTAS_WORKSHOP]: {
    id: SeasonalBuildingType.SANTAS_WORKSHOP,
    name: "Santa's Workshop",
    emoji: '🎅',
    description: '+10% to all Cash gains. Truly magical.',
    cost: 750000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 1,
    isSeasonal: true
  },
  [SeasonalBuildingType.CANDY_CANE_FACTORY]: {
    id: SeasonalBuildingType.CANDY_CANE_FACTORY,
    name: 'Candy Cane Fab',
    emoji: '🍭',
    description: 'Generates MASSIVE power from generators. Festive!',
    cost: 1500000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 45000,
    unlockLevel: 1,
    isSeasonal: true
  },
  // Storage Buildings
  [StorageBuildingType.SHED]: {
    id: StorageBuildingType.SHED,
    name: 'Storage Shed',
    emoji: '🏚️',
    description: 'A small shed for crop storage. +50 capacity.',
    cost: 500,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 3,
    isStorage: true,
    storageCapacity: 50
  },
  [StorageBuildingType.BARN]: {
    id: StorageBuildingType.BARN,
    name: 'Barn',
    emoji: '🏠',
    description: 'A sturdy barn for crops. +150 capacity.',
    cost: 2500,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 7,
    isStorage: true,
    storageCapacity: 150
  },
  [StorageBuildingType.SILO]: {
    id: StorageBuildingType.SILO,
    name: 'Grain Silo',
    emoji: '🏗️',
    description: 'Industrial grain storage. +400 capacity.',
    cost: 15000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 12,
    isStorage: true,
    storageCapacity: 400
  },
  [StorageBuildingType.WAREHOUSE]: {
    id: StorageBuildingType.WAREHOUSE,
    name: 'Warehouse',
    emoji: '🏭',
    description: 'Massive storage complex. +1000 capacity.',
    cost: 75000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 0,
    unlockLevel: 18,
    isStorage: true,
    storageCapacity: 1000
  },
  // Transport Buildings
  [TransportBuildingType.TRACTOR]: {
    id: TransportBuildingType.TRACTOR,
    name: 'Tractor',
    emoji: '🚜',
    description: 'Slow but reliable. Sells 5 crops/cycle.',
    cost: 1000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 8000,
    unlockLevel: 3,
    isTransport: true,
    transportThroughput: 5,
    transportPriceBonus: 0
  },
  [TransportBuildingType.TRUCK]: {
    id: TransportBuildingType.TRUCK,
    name: 'Delivery Truck',
    emoji: '🚚',
    description: 'Faster transport. Sells 15 crops/cycle.',
    cost: 5000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 6000,
    unlockLevel: 8,
    isTransport: true,
    transportThroughput: 15,
    transportPriceBonus: 0.05
  },
  [TransportBuildingType.TRAIN]: {
    id: TransportBuildingType.TRAIN,
    name: 'Freight Train',
    emoji: '🚂',
    description: 'Bulk transport. Sells 50 crops/cycle.',
    cost: 25000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 10000,
    unlockLevel: 14,
    isTransport: true,
    transportThroughput: 50,
    transportPriceBonus: 0.10
  },
  [TransportBuildingType.BOAT]: {
    id: TransportBuildingType.BOAT,
    name: 'Cargo Ship',
    emoji: '🚢',
    description: 'Massive cargo capacity. Sells 150 crops/cycle.',
    cost: 100000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 15000,
    unlockLevel: 22,
    isTransport: true,
    transportThroughput: 150,
    transportPriceBonus: 0.15
  },
  [TransportBuildingType.PLANE]: {
    id: TransportBuildingType.PLANE,
    name: 'Cargo Plane',
    emoji: '✈️',
    description: 'Premium express delivery. Sells 100 crops/cycle, +25% price.',
    cost: 250000,
    residueInput: 0,
    moneyOutput: 0,
    processingTimeMs: 5000,
    unlockLevel: 28,
    isTransport: true,
    transportThroughput: 100,
    transportPriceBonus: 0.25
  }
};

const INITIAL_PLOTS_COUNT = 25;
export const INITIAL_PLOTS: Plot[] = Array.from({ length: INITIAL_PLOTS_COUNT }).map((_, i) => ({
  id: `plot-${i}`,
  isUnlocked: i < 4,
  crop: null,
  manager: null,
}));

export const INITIAL_SECONDARY_PLOTS: BuildingPlotState[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `bplot-${i}`,
  building: null,
  progress: 0,
  upgrades: { speed: 1, bulk: 1, efficiency: 1 }
}));

export const INITIAL_SPECIAL_PLOTS: BuildingPlotState[] = Array.from({ length: 3 }).map((_, i) => ({
  id: `splot-${i}`,
  building: null,
  progress: 0,
  upgrades: { speed: 1, bulk: 1, efficiency: 1 }
}));

export const INITIAL_SEASONAL_PLOTS: BuildingPlotState[] = Array.from({ length: 2 }).map((_, i) => ({
  id: `seplot-${i}`,
  building: null,
  progress: 0,
  upgrades: { speed: 1, bulk: 1, efficiency: 1 }
}));

export const INITIAL_STORAGE_PLOTS: BuildingPlotState[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `stplot-${i}`,
  building: null,
  progress: 0,
  upgrades: { speed: 1, bulk: 1, efficiency: 1 }
}));

export const INITIAL_STOCKPILE: Stockpile = {
  [CropType.WHEAT]: 0,
  [CropType.CORN]: 0,
  [CropType.CARROT]: 0,
  [CropType.TOMATO]: 0,
  [CropType.PUMPKIN]: 0,
  [CropType.STRAWBERRY]: 0
};

export const BASE_STORAGE_CAPACITY = 25;

// Area sizes (plots per area)
export const PLOTS_PER_FIELD_AREA = 25;
export const PLOTS_PER_RANCH_AREA = 4;
export const PLOTS_PER_STORAGE_AREA = 6;

// Area expansion costs (base cost * multiplier^(areaCount-1))
export const FIELD_AREA_BASE_COST = 10000;
export const FIELD_AREA_COST_MULT = 2.5;
export const RANCH_AREA_BASE_COST = 15000;
export const RANCH_AREA_COST_MULT = 2.0;
export const STORAGE_AREA_BASE_COST = 8000;
export const STORAGE_AREA_COST_MULT = 2.0;

// Helper to create plots for a new area
export const createFieldAreaPlots = (areaIndex: number): Plot[] =>
  Array.from({ length: PLOTS_PER_FIELD_AREA }).map((_, i) => ({
    id: `plot-${areaIndex}-${i}`,
    isUnlocked: i < 4,
    crop: null,
    manager: null,
  }));

export const createRanchAreaPlots = (areaIndex: number): BuildingPlotState[] =>
  Array.from({ length: PLOTS_PER_RANCH_AREA }).map((_, i) => ({
    id: `bplot-${areaIndex}-${i}`,
    building: null,
    progress: 0,
    upgrades: { speed: 1, bulk: 1, efficiency: 1 }
  }));

export const createStorageAreaPlots = (areaIndex: number): BuildingPlotState[] =>
  Array.from({ length: PLOTS_PER_STORAGE_AREA }).map((_, i) => ({
    id: `stplot-${areaIndex}-${i}`,
    building: null,
    progress: 0,
    upgrades: { speed: 1, bulk: 1, efficiency: 1 }
  }));

export const INITIAL_GAME_STATE: GameState = {
  money: 10,
  residue: 0,
  xp: 0,
  level: 1,
  plots: INITIAL_PLOTS,
  secondaryPlots: INITIAL_SECONDARY_PLOTS,
  specialPlots: INITIAL_SPECIAL_PLOTS,
  seasonalPlots: INITIAL_SEASONAL_PLOTS,
  storagePlots: INITIAL_STORAGE_PLOTS,
  isSecondaryAreaUnlocked: false,
  isSpecialAreaUnlocked: false,
  isSeasonalAreaUnlocked: false,
  isStorageAreaUnlocked: false,
  fieldAreaCount: 1,
  ranchAreaCount: 1,
  storageAreaCount: 1,
  treeOrnaments: {
    baubles: false,
    tinsel: false,
    lights: false,
    presents: false,
    star: false,
  },
  unlockedCrops: [CropType.WHEAT],
  selectedSeed: CropType.WHEAT,
  lastTick: Date.now(),
  stockpile: INITIAL_STOCKPILE,
  storageCapacity: BASE_STORAGE_CAPACITY,
};

export const ORNAMENT_REQUIREMENTS = {
  baubles: { plots: 8 },
  tinsel: { level: 10 },
  lights: { areas: ['secondary'] },
  presents: { areas: ['special'] },
  star: { level: 30 },
};

export const PLOT_COST_BASE = 50;
export const PLOT_COST_MULTIPLIER = 1.4;
export const MANAGER_BASE_COST = 200;
export const MANAGER_COST_GROWTH = 1.5;
export const MANAGER_TRAINING_BASE_COST = 500;
export const MANAGER_TRAINING_COST_MULT = 1.8;
export const MANAGER_LEVEL_BONUS = 0.1;
export const MANAGER_SPECIALIZE_COST = 1000;
export const MANAGER_SPECIALTY_BONUS = 0.5;

// Manager multi-plot expansion
export const MANAGER_EXPAND_BASE_LEVEL = 5; // Level required for first additional plot
export const MANAGER_EXPAND_LEVEL_INCREMENT = 3; // Additional levels needed per plot (5, 8, 11, 14...)
export const MANAGER_EXPAND_BASE_COST = 500;
export const MANAGER_EXPAND_COST_MULT = 2.0;
export const MANAGER_MAX_ADDITIONAL_PLOTS = 4; // Maximum additional plots a manager can control

// Helper to get required level for nth additional plot (1-indexed)
export const getManagerExpandLevel = (additionalPlotNumber: number): number => {
  return MANAGER_EXPAND_BASE_LEVEL + (additionalPlotNumber - 1) * MANAGER_EXPAND_LEVEL_INCREMENT;
};

// Helper to get cost for nth additional plot (1-indexed)
export const getManagerExpandCost = (additionalPlotNumber: number): number => {
  return Math.floor(MANAGER_EXPAND_BASE_COST * Math.pow(MANAGER_EXPAND_COST_MULT, additionalPlotNumber - 1));
};

export const SECONDARY_AREA_COST = 5000;
export const SECONDARY_AREA_UNLOCK_LEVEL = 5;
export const SPECIAL_AREA_COST = 25000;
export const SPECIAL_AREA_UNLOCK_LEVEL = 15;
export const SEASONAL_AREA_COST = 100000;
export const STORAGE_AREA_COST = 2000;
export const STORAGE_AREA_UNLOCK_LEVEL = 3;
