// src/components/PhaseSelector.tsx
import React from "react";

interface Props {
  selectedPhase: string;
  onSelectPhase: (phase: string) => void;
  disabled?: boolean;
}

const phaseMap: Record<string, string> = {
  phase4: "Phase 4",
  phase4extra: "Phase 4 Extra",
  phase8: "Phase 8",
  phase8extra: "Phase 8 Extra"
};

const PhaseSelector: React.FC<Props> = ({ selectedPhase, onSelectPhase, disabled }) => {
  return (
    <div className="flex gap-3 flex-wrap">
      {Object.entries(phaseMap).map(([key, label]) => {
        const isActive = selectedPhase === key;
        return (
          <button
            key={key}
            onClick={() => onSelectPhase(isActive ? "" : key)}
            disabled={disabled && !isActive}
            className={`px-4 py-2 rounded text-sm font-semibold transition 
              ${isActive ? "bg-[#00f0cc] text-black" : "bg-white/20 text-white"} 
              ${disabled && !isActive ? "opacity-50 cursor-not-allowed" : "hover:bg-white/30"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default PhaseSelector;
