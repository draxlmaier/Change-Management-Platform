// src/components/HeaderWithBack.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import cmp3dLogo from "../assets/images/change_management_platform_full2.png";
import draxlLogo from "../assets/images/draxlmaier-group.png";
import { ArrowLeftIcon } from "lucide-react";

interface Props {
  backTo?: string;
}

const HeaderWithBack: React.FC<Props> = ({ backTo = "/tool-selection" }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md z-20 flex items-center justify-between px-6">
      <button onClick={() => navigate(backTo)} className="flex items-center gap-1 p-2 hover:opacity-80">
        <ArrowLeftIcon className="h-5 w-5 text-black" />
        <span className="text-black font-medium">Back</span>
      </button>
      <img src={cmp3dLogo} alt="CMP" className="h-10" />
      <img src={draxlLogo} alt="Draxlmaier" className="h-8" />
    </header>
  );
};

export default HeaderWithBack;
