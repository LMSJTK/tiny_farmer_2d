import React from 'react';
import { BuildingPlotState, BuildingConfig } from '../types';
import { BUILDINGS } from '../constants';
import { Plus, Hammer } from 'lucide-react';

interface BuildingPlotProps {
  plot: BuildingPlotState;
  onConstruct: (plotId: string) => void;
}

export const BuildingPlot: React.FC<BuildingPlotProps> = ({ plot, onConstruct }) => {
  
  if (!plot.building) {
    return (
      <div 
        onClick={() => onConstruct(plot.id)}
        className="aspect-video sm:aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-200 hover:border-slate-400 cursor-pointer transition-all group"
      >
         <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
            <Plus size={20} />
         </div>
         <span className="text-xs font-bold uppercase tracking-wider">Construct</span>
      </div>
    );
  }

  const config = BUILDINGS[plot.building];
  const isProcessing = plot.progress > 0;
  const progressPercent = Math.min(100, plot.progress);
  
  // Calculate total upgrades for a visual badge
  const totalLevels = (plot.upgrades?.speed || 1) + (plot.upgrades?.bulk || 1) + (plot.upgrades?.efficiency || 1) - 3;

  return (
    <div 
      onClick={() => onConstruct(plot.id)} // Selects the building in sidebar
      className="aspect-video sm:aspect-square bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
    >
       {/* Active Indicator (Processing) */}
       {isProcessing && (
         <div className="absolute top-2 right-2 flex gap-1 items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
         </div>
       )}
       {!isProcessing && config.residueInput > 0 && (
         <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-300" title="Waiting for residue..." />
       )}

       {/* Level Badge */}
       {totalLevels > 0 && (
         <div className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-200">
            <Hammer size={8} /> +{totalLevels}
         </div>
       )}
       
       <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300 z-10">
          {config.emoji}
       </div>
       <div className="text-center z-10">
          <div className="font-bold text-slate-700 text-sm leading-tight">{config.name}</div>
          <div className="text-[10px] text-slate-400 mt-1">
             {isProcessing ? 'Processing...' : (config.residueInput > 0 ? 'Need Residue' : 'Ready')}
          </div>
       </div>

       {/* Progress Bar Background */}
       {isProcessing && (
         <div 
            className="absolute bottom-0 left-0 h-1.5 bg-green-500 transition-all duration-300 ease-linear z-20"
            style={{ width: `${progressPercent}%` }}
         />
       )}

       {/* Production Tooltip - Updated to show "Tap to Manage" on hover */}
       <div className="absolute inset-x-0 bottom-0 bg-slate-50 border-t border-slate-100 p-2 text-[10px] flex justify-center font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          Manage Building
       </div>
    </div>
  );
};