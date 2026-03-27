import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import UpgradeModal from "@/components/UpgradeModal";
import { User, DollarSign, Shield, LogIn, X, Crown, CreditCard, RefreshCw, Loader2 } from "lucide-react";

const ProfilePage = () => {
  const { profile, isAdmin, updateProfile, impersonateUser, impersonating, stopImpersonating, user, subscription, checkSubscription } = useAuth();
  const { isPremiumActive, isTrialActive, trialDaysRemaining, plan } = usePermissions();
  const [name, setName] = useState(profile?.name || "");
  const [totalLimit, setTotalLimit] = useState(profile?.total_limit?.toString() || "0");
  const [impersonateEmail, setImpersonateEmail] = useState("");
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  React.useEffect(() => {
    setName(profile?.name || "");
    setTotalLimit(profile?.total_limit?.toString() || "0");
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, total_limit: parseFloat(totalLimit) || 0 } as any);
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleImpersonate = async () => {
    if (!impersonateEmail.trim()) return;
    setImpersonateLoading(true);
    const { error } = await impersonateUser(impersonateEmail);
    if (error) toast.error(error);
    else {
      toast.success(`Visualizando como: ${impersonateEmail}`);
      setImpersonateOpen(false);
      setImpersonateEmail("");
    }
    setImpersonateLoading(false);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL do portal não retornada");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir portal de assinatura");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshLoading(true);
    await checkSubscription();
    setRefreshLoading(false);
    toast.success("Status da assinatura atualizado!");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {impersonating && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between rounded-lg bg-warning/15 border border-warning/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Visualizando como: <strong>{impersonating.name}</strong></span>
              </div>
              <Button size="sm" variant="ghost" onClick={stopImpersonating}>
                <X className="w-4 h-4 mr-1" /> Sair
              </Button>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </motion.div>

        {/* Subscription Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className={isPremiumActive ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${isPremiumActive ? "text-warning" : "text-muted-foreground"}`} />
                Plano {isPremiumActive ? "Premium" : "Gratuito"}
                {isTrialActive && (
                  <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                    Trial — {trialDaysRemaining} dias restantes
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPremiumActive ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin
                      ? "Acesso Premium vitalício (Admin)."
                      : isTrialActive
                      ? `Seu trial expira em ${trialDaysRemaining} dia(s). Assine para manter o acesso.`
                      : subscription?.subscription_end
                      ? `Sua assinatura renova em ${new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}.`
                      : "Acesso Premium ativo."}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {!isAdmin && subscription?.subscribed && subscription?.product_id !== "trial" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                      >
                        {portalLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CreditCard className="w-4 h-4 mr-1" />}
                        Gerenciar Assinatura
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshSubscription}
                      disabled={refreshLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${refreshLoading ? "animate-spin" : ""}`} />
                      Atualizar Status
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Você está no plano gratuito com recursos limitados. Assine o Premium para desbloquear tudo.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      className="gradient-primary hover:opacity-90"
                      size="sm"
                      onClick={() => setUpgradeOpen(true)}
                    >
                      <Crown className="w-4 h-4 mr-1" />
                      Assinar Premium
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshSubscription}
                      disabled={refreshLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${refreshLoading ? "animate-spin" : ""}`} />
                      Atualizar Status
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Limite Total de Gastos (R$)
                  </Label>
                  <Input type="number" value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)} min="0" step="0.01" />
                </div>
                <Button type="submit" className="gradient-primary hover:opacity-90">Salvar Alterações</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {isAdmin && !impersonating && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-warning/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-warning" />
                  Administração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-warning/30 hover:bg-warning/10">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar como outro usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-warning" />
                        Entrar como...
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Digite o email do usuário para visualizar o aplicativo com as informações dele.
                      </p>
                      <div className="space-y-2">
                        <Label>Email do usuário</Label>
                        <Input
                          type="email"
                          value={impersonateEmail}
                          onChange={(e) => setImpersonateEmail(e.target.value)}
                          placeholder="usuario@email.com"
                          onKeyDown={(e) => e.key === "Enter" && handleImpersonate()}
                        />
                      </div>
                      <Button
                        onClick={handleImpersonate}
                        disabled={impersonateLoading}
                        className="w-full gradient-primary hover:opacity-90"
                      >
                        {impersonateLoading ? "Buscando..." : "Entrar como este usuário"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AppLayout>
  );
};

export default ProfilePage;
