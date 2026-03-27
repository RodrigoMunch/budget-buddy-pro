import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const STRIPE_PRICES = {
  monthly: "price_1TFfsgGZ00ilQ7HfHDD02kga",
  yearly: "price_1TFftQGZ00ilQ7HfSnauOm2L",
};

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
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PRICES[plan] },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar checkout");
    } finally {
      setLoading(null);
    }
  };

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
            <div
              className="rounded-lg border-2 border-primary p-4 relative cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => !loading && handleCheckout("yearly")}
            >
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
              {loading === "yearly" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div
              className="rounded-lg border p-4 cursor-pointer hover:bg-primary/5 transition-colors relative"
              onClick={() => !loading && handleCheckout("monthly")}
            >
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
              {loading === "monthly" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
