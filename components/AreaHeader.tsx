import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface AreaHeaderProps {
  title: string;
  emoji: string;
  currentArea: number;
  totalAreas: number;
  onPrevArea: () => void;
  onNextArea: () => void;
  onBuyNewArea: () => void;
  newAreaCost: number;
  canAffordNewArea: boolean;
  unlockLevel?: number;
  currentLevel?: number;
  bgColor?: string;
  textColor?: string;
}

export const AreaHeader: React.FC<AreaHeaderProps> = ({
  title,
  emoji,
  currentArea,
  totalAreas,
  onPrevArea,
  onNextArea,
  onBuyNewArea,
  newAreaCost,
  canAffordNewArea,
  unlockLevel,
  currentLevel,
  bgColor = 'bg-green-100',
  textColor = 'text-green-700'
}) => {
  const isOnLastArea = currentArea === totalAreas;
  const canUnlock = !unlockLevel || (currentLevel && currentLevel >= unlockLevel);

  const formatCost = (cost: number): string => {
    if (cost >= 1000000) return `${(cost / 1000000).toFixed(1)}M`;
    if (cost >= 1000) return `${(cost / 1000).toFixed(0)}K`;
    return cost.toString();
  };

  return (
    <div className={`${bgColor} border-b border-slate-200 px-4 py-2 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h2 className={`font-bold ${textColor}`}>{title}</h2>
        {totalAreas > 1 && (
          <span className={`text-sm ${textColor} opacity-70`}>
            ({currentArea} of {totalAreas})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Navigation arrows */}
        {totalAreas > 1 && (
          <>
            <button
              onClick={onPrevArea}
              disabled={currentArea === 1}
              className={`p-1.5 rounded-lg transition-all ${
                currentArea === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : `${textColor} hover:bg-white/50`
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={onNextArea}
              disabled={currentArea === totalAreas}
              className={`p-1.5 rounded-lg transition-all ${
                currentArea === totalAreas
                  ? 'text-slate-300 cursor-not-allowed'
                  : `${textColor} hover:bg-white/50`
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Buy new area button - only show when on last area */}
        {isOnLastArea && canUnlock && (
          <button
            onClick={onBuyNewArea}
            disabled={!canAffordNewArea}
            className={`ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              canAffordNewArea
                ? 'bg-white/80 hover:bg-white shadow-sm text-slate-700'
                : 'bg-white/30 text-slate-400 cursor-not-allowed'
            }`}
            title={`Add new ${title.toLowerCase()} area for $${newAreaCost.toLocaleString()}`}
          >
            <Plus size={14} />
            <span>${formatCost(newAreaCost)}</span>
          </button>
        )}
      </div>
    </div>
  );
};
