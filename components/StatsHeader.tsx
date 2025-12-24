import React from 'react';
import { GameState, CropType } from '../types';
import { Coins, Leaf, Trophy, Package, ShoppingCart } from 'lucide-react';
import { CROPS } from '../constants';

interface StatsHeaderProps {
  state: GameState;
  xpToNextLevel: number;
  onManualSell?: () => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ state, xpToNextLevel, onManualSell }) => {
  const xpPercentage = Math.min(100, (state.xp / xpToNextLevel) * 100);
  const stockpileValues = state.stockpile ? (Object.values(state.stockpile) as number[]) : [];
  const totalStockpile = stockpileValues.reduce((sum, count) => sum + count, 0);
  const capacity = state.storageCapacity || 25;
  const stockpilePercentage = capacity > 0 ? Math.min(100, (totalStockpile / capacity) * 100) : 0;
  const canSell = totalStockpile > 0;

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm p-4 w-full">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl shadow-green-200 shadow-lg">
            🧑‍🌾
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-slate-800 leading-tight">Tiny Farmer</h1>
            <p className="text-xs text-slate-500 font-medium">Tycoon Inc.</p>
          </div>
        </div>

        {/* Resources */}
        <div className="flex items-center gap-2 sm:gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          {/* Money */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center border border-yellow-200">
              <Coins size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cash</p>
              <p className="text-sm sm:text-lg font-bold text-slate-700">${Math.floor(state.money).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-slate-200"></div>

          {/* Residue */}
           <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
              <Leaf size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Residue</p>
              <p className="text-sm sm:text-lg font-bold text-slate-700">{Math.floor(state.residue).toLocaleString()}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          {/* Stockpile */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
              <Package size={16} />
            </div>
            <div className="flex flex-col min-w-[70px]">
              <div className="flex justify-between items-end">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Stock</p>
                <span className="text-[10px] text-slate-400">{totalStockpile}/{state.storageCapacity}</span>
              </div>
              {/* Storage Bar */}
              <div className="h-2 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stockpilePercentage >= 90 ? 'bg-red-500' : stockpilePercentage >= 70 ? 'bg-orange-500' : 'bg-orange-400'}`}
                  style={{ width: `${stockpilePercentage}%` }}
                />
              </div>
            </div>
            {/* Manual Sell Button */}
            {onManualSell && (
              <button
                onClick={onManualSell}
                disabled={!canSell}
                className={`ml-1 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  canSell
                    ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-sm hover:shadow active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Sell 1 crop manually (75% price)"
              >
                <ShoppingCart size={12} />
              </button>
            )}
          </div>

          <div className="w-px h-8 bg-slate-200"></div>

          {/* Level / XP */}
          <div className="flex items-center gap-2 px-2">
            <div className="relative">
               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200 z-10 relative">
                <Trophy size={16} />
              </div>
            </div>
            <div className="flex flex-col min-w-[80px]">
              <div className="flex justify-between items-end">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lvl {state.level}</p>
                <span className="text-[10px] text-slate-400">{Math.floor(state.xp)}/{Math.floor(xpToNextLevel)}</span>
              </div>
              {/* XP Bar */}
              <div className="h-2 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};