export enum CropType {
  WHEAT = 'WHEAT',
  CORN = 'CORN',
  CARROT = 'CARROT',
  TOMATO = 'TOMATO',
  PUMPKIN = 'PUMPKIN',
  STRAWBERRY = 'STRAWBERRY',
}

export enum BuildingType {
  COMPOSTER = 'COMPOSTER',
  COOP = 'COOP',
  GENERATOR = 'GENERATOR'
}

export enum SpecialBuildingType {
  MANOR = 'MANOR',
  AIRFIELD = 'AIRFIELD',
  POWER_PLANT = 'POWER_PLANT'
}

export enum SeasonalBuildingType {
  SANTAS_WORKSHOP = 'SANTAS_WORKSHOP',
  CANDY_CANE_FACTORY = 'CANDY_CANE_FACTORY'
}

export enum StorageBuildingType {
  SHED = 'SHED',
  BARN = 'BARN',
  SILO = 'SILO',
  WAREHOUSE = 'WAREHOUSE'
}

export enum TransportBuildingType {
  TRACTOR = 'TRACTOR',
  TRUCK = 'TRUCK',
  TRAIN = 'TRAIN',
  BOAT = 'BOAT',
  PLANE = 'PLANE'
}

export enum ManagerStrategy {
  BALANCED = 'BALANCED',
  RESIDUE = 'RESIDUE'
}

export interface CropConfig {
  id: CropType;
  name: string;
  emoji: string;
  baseGrowthTimeMs: number;
  sellPrice: number;
  cost: number;
  xpReward: number;
  residueReward: number;
  unlockLevel: number;
  color: string;
}

export interface BuildingConfig {
  id: BuildingType | SpecialBuildingType | SeasonalBuildingType | StorageBuildingType | TransportBuildingType;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  residueInput: number;
  moneyOutput: number;
  processingTimeMs: number;
  unlockLevel: number;
  isSpecial?: boolean;
  isSeasonal?: boolean;
  isStorage?: boolean;
  isTransport?: boolean;
  storageCapacity?: number;
  transportThroughput?: number;
  transportPriceBonus?: number;
}

export interface ManagerState {
  id: string;
  level: number;
  specialty: CropType | null;
  strategy: ManagerStrategy;
  managedPlotIds: string[]; // Additional plots this manager controls (beyond their home plot)
}

export interface Plot {
  id: string;
  isUnlocked: boolean;
  crop: {
    type: CropType;
    plantedAt: number; 
    progress: number; 
    isReady: boolean;
    isWithered: boolean; 
  } | null;
  manager: ManagerState | null; 
}

export interface BuildingUpgrades {
  speed: number;
  bulk: number;
  efficiency: number;
}

export interface BuildingPlotState {
  id: string;
  building: BuildingType | SpecialBuildingType | SeasonalBuildingType | StorageBuildingType | TransportBuildingType | null;
  progress: number;
  upgrades: BuildingUpgrades;
}

export interface TreeOrnaments {
  baubles: boolean;
  tinsel: boolean;
  lights: boolean;
  presents: boolean;
  star: boolean;
}

export type Stockpile = Record<CropType, number>;

export interface GameState {
  money: number;
  residue: number;
  xp: number;
  level: number;
  plots: Plot[];
  secondaryPlots: BuildingPlotState[];
  specialPlots: BuildingPlotState[];
  seasonalPlots: BuildingPlotState[];
  storagePlots: BuildingPlotState[];
  isSecondaryAreaUnlocked: boolean;
  isSpecialAreaUnlocked: boolean;
  isSeasonalAreaUnlocked: boolean;
  isStorageAreaUnlocked: boolean;
  // Area expansion counts (1 = first area unlocked)
  fieldAreaCount: number;
  ranchAreaCount: number;
  storageAreaCount: number;
  treeOrnaments: TreeOrnaments;
  unlockedCrops: CropType[];
  selectedSeed: CropType;
  lastTick: number;
  stockpile: Stockpile;
  storageCapacity: number;
}

export interface ManagerCost {
  cropType: CropType;
  cost: number;
}