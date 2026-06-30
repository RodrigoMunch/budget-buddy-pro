import React, { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { ListSkeleton } from "@/components/PageSkeleton";
import { Plus, TrendingUp, ArrowDownCircle, ArrowUpCircle, Pencil, CalendarIcon, PiggyBank, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WALLET_TYPES = [
  { value: "renda_fixa", label: "Renda Fixa", icon: "🏦" },
  { value: "acoes", label: "Ações", icon: "📈" },
  { value: "fii", label: "Fundos Imobiliários", icon: "🏢" },
  { value: "cripto", label: "Criptomoedas", icon: "₿" },
  { value: "tesouro", label: "Tesouro Direto", icon: "🏛️" },
  { value: "previdencia", label: "Previdência", icon: "🛡️" },
  { value: "general", label: "Outro", icon: "💰" },
];

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#ef4444", "#14b8a6", "#6366f1"];

const InvestmentsPage = () => {
  const { wallets, transactions, loading, addWallet, updateWallet, deleteWallet, addContribution, addWithdrawal } = useFinance();

  const [walletOpen, setWalletOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("general");
  const [walletColor, setWalletColor] = useState(COLORS[0]);

  const [opOpen, setOpOpen] = useState(false);
  const [opMode, setOpMode] = useState<"contribution" | "withdrawal">("contribution");
  const [opWalletId, setOpWalletId] = useState<string | null>(null);
  const [opAmount, setOpAmount] = useState("");
  const [opDescription, setOpDescription] = useState("");
  const [opDate, setOpDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const walletStats = useMemo(() => {
    return wallets.map((w) => {
      const txs = transactions.filter((t) => t.investment_wallet_id === w.id);
      const contributions = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const withdrawals = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      return { wallet: w, balance: contributions - withdrawals, contributions, withdrawals, count: txs.length };
    });
  }, [wallets, transactions]);

  const totalBalance = walletStats.reduce((s, w) => s + w.balance, 0);
  const totalContributions = walletStats.reduce((s, w) => s + w.contributions, 0);
  const totalWithdrawals = walletStats.reduce((s, w) => s + w.withdrawals, 0);

  const allMovements = useMemo(() => {
    return transactions
      .filter((t) => t.investment_wallet_id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const resetWalletForm = () => {
    setEditingWalletId(null);
    setWalletName("");
    setWalletType("general");
    setWalletColor(COLORS[0]);
  };

  const openNewWallet = () => {
    resetWalletForm();
    setWalletOpen(true);
  };

  const openEditWallet = (id: string) => {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    setEditingWalletId(id);
    setWalletName(w.name);
    setWalletType(w.type);
    setWalletColor(w.color);
    setWalletOpen(true);
  };

  const handleSaveWallet = async () => {
    if (!walletName.trim()) {
      toast.error("Informe um nome para a carteira");
      return;
    }
    const typeMeta = WALLET_TYPES.find((t) => t.value === walletType);
    const icon = typeMeta?.icon || "💰";
    if (editingWalletId) {
      await updateWallet(editingWalletId, { name: walletName.trim(), type: walletType, color: walletColor, icon });
      toast.success("Carteira atualizada!");
    } else {
      await addWallet({ name: walletName.trim(), type: walletType, color: walletColor, icon });
      toast.success("Carteira criada!");
    }
    setWalletOpen(false);
    resetWalletForm();
  };

  const handleDeleteWallet = async (id: string) => {
    await deleteWallet(id);
    toast.success("Carteira removida!");
  };

  const openOp = (mode: "contribution" | "withdrawal", walletId: string) => {
    setOpMode(mode);
    setOpWalletId(walletId);
    setOpAmount("");
    setOpDescription("");
    setOpDate(new Date());
    setOpOpen(true);
  };

  const handleSaveOp = async () => {
    if (!opWalletId) return;
    const value = parseFloat(opAmount);
    if (!value || value <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    const dateStr = format(opDate, "yyyy-MM-dd");
    if (opMode === "contribution") {
      await addContribution(opWalletId, value, dateStr, opDescription);
      toast.success("Aporte registrado!");
    } else {
      const wallet = walletStats.find((w) => w.wallet.id === opWalletId);
      if (wallet && value > wallet.balance) {
        toast.error(`Resgate maior que o saldo disponível (R$ ${wallet.balance.toFixed(2)})`);
        return;
      }
      await addWithdrawal(opWalletId, value, dateStr, opDescription);
      toast.success("Resgate registrado!");
    }
    setOpOpen(false);
  };

  if (loading) return <AppLayout><ListSkeleton /></AppLayout>;

  const opWallet = wallets.find((w) => w.id === opWalletId);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold truncate">Investimentos</h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Aportes saem do saldo disponível, resgates retornam como entrada</p>
            </div>
          </div>
          {wallets.length > 0 && (
            <Button onClick={openNewWallet} className="gradient-primary hover:opacity-90 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Nova carteira
            </Button>
          )}
        </motion.div>

        {wallets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <PiggyBank className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Nenhuma carteira ainda</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                  Organize seus investimentos em carteiras (renda fixa, ações, cripto, etc.) e acompanhe aportes e resgates.
                </p>
                <Button onClick={openNewWallet} className="gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-1" /> Criar primeira carteira
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <Card>
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Saldo total investido</p>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-500">R$ {totalBalance.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-primary" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Total aportado</p>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">R$ {totalContributions.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-destructive" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Total resgatado</p>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">R$ {totalWithdrawals.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {walletStats.map(({ wallet, balance, contributions, withdrawals, count }) => (
                <motion.div key={wallet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="group">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${wallet.color}20` }}>
                            {wallet.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{wallet.name}</p>
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              {WALLET_TYPES.find((t) => t.value === wallet.type)?.label || "Outro"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEditWallet(wallet.id)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Excluir carteira"
                            description={`Deseja excluir a carteira "${wallet.name}"? As transações vinculadas continuarão no histórico, mas perderão a referência.`}
                            onConfirm={() => handleDeleteWallet(wallet.id)}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Saldo da carteira</p>
                        <p className="text-2xl font-bold" style={{ color: wallet.color }}>R$ {balance.toFixed(2)}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>Aportes: <span className="text-foreground font-medium">R$ {contributions.toFixed(2)}</span></span>
                          <span>Resgates: <span className="text-foreground font-medium">R$ {withdrawals.toFixed(2)}</span></span>
                          <span>{count} movimentações</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => openOp("contribution", wallet.id)} className="gradient-primary hover:opacity-90">
                          <ArrowUpCircle className="w-4 h-4 mr-1" /> Aportar
                        </Button>
                        <Button onClick={() => openOp("withdrawal", wallet.id)} variant="outline" disabled={balance <= 0}>
                          <ArrowDownCircle className="w-4 h-4 mr-1" /> Resgatar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {allMovements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Movimentações recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allMovements.slice(0, 20).map((t) => {
                      const w = wallets.find((x) => x.id === t.investment_wallet_id);
                      const isContribution = t.type === "expense";
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isContribution ? "bg-primary/10" : "bg-emerald-500/10"}`}>
                              {isContribution ? <ArrowUpCircle className="w-4 h-4 text-primary" /> : <ArrowDownCircle className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{t.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {w?.name || "Carteira removida"} • {format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <span className={`font-semibold text-sm whitespace-nowrap ${isContribution ? "text-primary" : "text-emerald-500"}`}>
                            {isContribution ? "+" : "-"} R$ {t.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Wallet dialog */}
        <Dialog open={walletOpen} onOpenChange={(o) => { setWalletOpen(o); if (!o) resetWalletForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWalletId ? "Editar carteira" : "Nova carteira"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={walletName} onChange={(e) => setWalletName(e.target.value)} placeholder="Ex: Tesouro Selic 2030" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WALLET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWalletColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${walletColor === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleSaveWallet} className="w-full gradient-primary hover:opacity-90">
                {editingWalletId ? "Salvar alterações" : "Criar carteira"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Operation dialog */}
        <Dialog open={opOpen} onOpenChange={setOpOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {opMode === "contribution" ? "Novo aporte" : "Novo resgate"}
                {opWallet && <span className="text-muted-foreground font-normal"> — {opWallet.name}</span>}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" min="0.01" step="0.01" value={opAmount} onChange={(e) => setOpAmount(e.target.value)} placeholder="0,00" />
                {opMode === "contribution" && <p className="text-xs text-muted-foreground">O valor sairá do seu saldo disponível.</p>}
                {opMode === "withdrawal" && <p className="text-xs text-muted-foreground">O valor voltará como entrada no seu saldo disponível.</p>}
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input value={opDescription} onChange={(e) => setOpDescription(e.target.value)} placeholder={opMode === "contribution" ? "Ex: Aporte mensal" : "Ex: Resgate parcial"} />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />{format(opDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={opDate} onSelect={(d) => { if (d) { setOpDate(d); setCalendarOpen(false); } }} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleSaveOp} className={`w-full ${opMode === "contribution" ? "gradient-primary" : "bg-emerald-500 hover:bg-emerald-500/90 text-white"}`}>
                Registrar {opMode === "contribution" ? "aporte" : "resgate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default InvestmentsPage;