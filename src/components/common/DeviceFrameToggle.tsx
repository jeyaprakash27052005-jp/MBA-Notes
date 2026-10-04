import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface DeviceFrameToggleProps {
  isMobileFrame: boolean;
  onToggle: (val: boolean) => void;
}

export const DeviceFrameToggle: React.FC<DeviceFrameToggleProps> = ({
  isMobileFrame,
  onToggle,
}) => {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 backdrop-blur-md text-white p-1 rounded-full shadow-lg border border-slate-700">
      <button
        onClick={() => onToggle(true)}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
          isMobileFrame
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white'
        }`}
        title="Mobile App View (Android / iOS Preview)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Mobile App</span>
      </button>
      <button
        onClick={() => onToggle(false)}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all ${
          !isMobileFrame
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white'
        }`}
        title="Full Screen Web View"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Full Web</span>
      </button>
    </div>
  );
};
