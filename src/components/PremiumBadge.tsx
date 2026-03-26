import { Crown } from "lucide-react";

const PremiumBadge = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning/20 text-warning ${className}`}>
    <Crown className="w-2.5 h-2.5" />
    PRO
  </span>
);

export default PremiumBadge;
