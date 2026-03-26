import React, { useState } from "react";
import { Lock } from "lucide-react";
import UpgradeModal from "./UpgradeModal";

interface PremiumGateProps {
  locked: boolean;
  feature?: string;
  children: React.ReactNode;
  blur?: boolean;
}

const PremiumGate = ({ locked, feature, children, blur = true }: PremiumGateProps) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!locked) return <>{children}</>;

  return (
    <>
      <div className="relative">
        <div className={blur ? "filter blur-[3px] pointer-events-none select-none" : "pointer-events-none opacity-50"}>
          {children}
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10 bg-background/20 rounded-lg"
          onClick={() => setUpgradeOpen(true)}
        >
          <div className="flex flex-col items-center gap-2 bg-card/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border">
            <Lock className="w-6 h-6 text-primary" />
            <p className="text-sm font-medium text-center">Recurso Premium</p>
            <p className="text-xs text-muted-foreground text-center">Clique para desbloquear</p>
          </div>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} feature={feature} />
    </>
  );
};

export default PremiumGate;
