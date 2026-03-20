import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { User, DollarSign, Shield, LogIn, X } from "lucide-react";

const ProfilePage = () => {
  const { profile, isAdmin, updateProfile, impersonateUser, impersonating, stopImpersonating, user } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [totalLimit, setTotalLimit] = useState(profile?.total_limit?.toString() || "0");
  const [impersonateEmail, setImpersonateEmail] = useState("");
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateLoading, setImpersonateLoading] = useState(false);

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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Impersonation banner */}
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

        {/* Admin impersonation */}
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
    </AppLayout>
  );
};

export default ProfilePage;
