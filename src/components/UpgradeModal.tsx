import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const benefits = [
  "Categorias ilimitadas",
  "Parcelamentos ilimitados",
  "Histórico completo (todos os meses)",
  "Gráficos avançados e tendências",
  "Exportação CSV e PDF",
  "Metas financeiras",
  "Suporte prioritário",
];

const UpgradeModal = ({ open, onOpenChange, feature }: UpgradeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="w-6 h-6 text-warning" />
            Desbloqueie o Premium
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {feature && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-sm">
                <Sparkles className="w-4 h-4 inline mr-1 text-primary" />
                {feature}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Você está no limite do plano gratuito. Com o Premium, você desbloqueia
            ferramentas que transformam seu controle financeiro.
          </p>

          <div className="space-y-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-3 pt-2">
            <div className="rounded-lg border-2 border-primary p-4 relative">
              <div className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                Mais popular
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-semibold">Anual</p>
                  <p className="text-sm text-muted-foreground">Economize 33%</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">R$ 79,90</p>
                  <p className="text-xs text-muted-foreground">/ano</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-semibold">Mensal</p>
                  <p className="text-sm text-muted-foreground">Cancele quando quiser</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">R$ 9,90</p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full gradient-primary hover:opacity-90 h-12 text-base" disabled>
            <Crown className="w-4 h-4 mr-2" />
            Em breve — Assinar Premium
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Experimente 7 dias grátis. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
