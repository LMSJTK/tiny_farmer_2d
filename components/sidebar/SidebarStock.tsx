import React from 'react';
import { GameState, CropType } from '../../types';
import { CROPS } from '../../constants';
import { Package, ShoppingCart, TrendingDown } from 'lucide-react';

interface SidebarStockProps {
  state: GameState;
  onSellCrop: (cropType: CropType, amount: number) => void;
}

const MANUAL_SELL_PENALTY = 0.75;

export const SidebarStock: React.FC<SidebarStockProps> = ({ state, onSellCrop }) => {
  const stockpileValues = state.stockpile ? (Object.values(state.stockpile) as number[]) : [];
  const totalStockpile = stockpileValues.reduce((sum, count) => sum + count, 0);
  const capacity = state.storageCapacity || 25;

  // Get crops that are in stock, sorted by value (highest first)
  const cropsInStock = Object.values(CropType)
    .map(cropType => ({
      cropType,
      config: CROPS[cropType],
      count: state.stockpile?.[cropType] || 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.config.sellPrice - a.config.sellPrice);

  // Get all crops for reference (even empty ones)
  const allCrops = Object.values(CropType)
    .map(cropType => ({
      cropType,
      config: CROPS[cropType],
      count: state.stockpile?.[cropType] || 0
    }))
    .sort((a, b) => a.config.unlockLevel - b.config.unlockLevel);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Crop Stockpile</h3>
            <p className="text-orange-100 text-sm">{totalStockpile} / {capacity} stored</p>
          </div>
        </div>
        {/* Capacity bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              totalStockpile >= capacity * 0.9 ? 'bg-red-400' :
              totalStockpile >= capacity * 0.7 ? 'bg-orange-300' : 'bg-white'
            }`}
            style={{ width: `${Math.min(100, (totalStockpile / capacity) * 100)}%` }}
          />
        </div>
      </div>

      {/* Manual sell warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
        <TrendingDown size={14} className="mt-0.5 flex-shrink-0" />
        <span>Manual sales get <strong>75%</strong> of normal price. Build transport buildings for full value!</span>
      </div>

      {/* Stock breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">In Stock</h4>

        {cropsInStock.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No crops in stockpile</p>
            <p className="text-xs mt-1">Harvest crops to add them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cropsInStock.map(({ cropType, config, count }) => {
              const manualPrice = Math.floor(config.sellPrice * MANUAL_SELL_PENALTY);
              return (
                <div
                  key={cropType}
                  className={`${config.color} rounded-xl p-3 border-2 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <p className="font-bold text-sm">{config.name}</p>
                        <p className="text-xs opacity-75">
                          ${manualPrice} each <span className="opacity-50">(was ${config.sellPrice})</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{count}</p>
                      <p className="text-xs opacity-75">in stock</p>
                    </div>
                  </div>

                  {/* Sell buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onSellCrop(cropType, 1)}
                      className="flex-1 bg-white/50 hover:bg-white/80 text-current py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <ShoppingCart size={12} /> Sell 1
                    </button>
                    <button
                      onClick={() => onSellCrop(cropType, 5)}
                      disabled={count < 5}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        count >= 5
                          ? 'bg-white/50 hover:bg-white/80 text-current'
                          : 'bg-white/20 text-current/50 cursor-not-allowed'
                      }`}
                    >
                      Sell 5
                    </button>
                    <button
                      onClick={() => onSellCrop(cropType, count)}
                      className="flex-1 bg-white/50 hover:bg-white/80 text-current py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      Sell All
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All crops reference */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">All Crops</h4>
        <div className="grid grid-cols-3 gap-2">
          {allCrops.map(({ cropType, config, count }) => {
            const isUnlocked = state.unlockedCrops.includes(cropType);
            return (
              <div
                key={cropType}
                className={`rounded-lg p-2 text-center ${
                  isUnlocked
                    ? count > 0 ? config.color : 'bg-slate-100 border border-slate-200'
                    : 'bg-slate-50 border border-dashed border-slate-200 opacity-50'
                }`}
              >
                <span className="text-lg">{config.emoji}</span>
                <p className="text-xs font-bold mt-0.5">{count}</p>
                {!isUnlocked && (
                  <p className="text-[8px] text-slate-400">Lvl {config.unlockLevel}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
