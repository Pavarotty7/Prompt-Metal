
import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, description, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block ml-1">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsVisible(!isVisible);
          }
        }}
        tabIndex={0}
        role="button"
        className="text-slate-400 hover:text-amber-500 transition-colors p-0.5 cursor-pointer inline-flex"
        aria-label="Ajuda"
      >
        <HelpCircle size={14} />
      </div>

      {isVisible && (
        <div className={`absolute z-[100] w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10 animate-fade-in ${positionClasses[position]}`}>
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{title}</h4>
            <X size={10} className="text-slate-500" />
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-slate-300">
            {description}
          </p>
          <div className="absolute w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45 -bottom-1 left-1/2 -translate-x-1/2 hidden md:block"></div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
