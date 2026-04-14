import React, { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import PremiumGate from "@/components/PremiumGate";
import UpgradeModal from "@/components/UpgradeModal";
import { Plus, TrendingUp, TrendingDown, Wallet, Target, CalendarIcon, Crown } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const CHART_COLORS = [
  "hsl(242, 65%, 60%)", "hsl(145, 63%, 42%)", "hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)",
  "hsl(200, 70%, 50%)", "hsl(280, 60%, 55%)", "hsl(170, 55%, 45%)", "hsl(20, 80%, 55%)",
];

const DashboardPage = () => {
  const { activeProfile } = useAuth();
  const { categories, transactions, addTransaction, deleteTransaction, loading } = useFinance();
  const { canViewBarChart, isPremiumActive } = usePermissions();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [installments, setInstallments] = useState("1");
  const [isRecurring, setIsRecurring] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const now = new Date();
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Current month income/expense (for cards)
  const totalIncome = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Accumulated balance: all transactions up to end of current month
  const balance = useMemo(() => {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return transactions
      .filter((t) => new Date(t.date) <= endOfMonth)
      .reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
  }, [transactions]);

  // Previous month transactions for comparison
  const prevMonthTransactions = useMemo(() => {
    const prev = subMonths(now, 1);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    });
  }, [transactions]);

  const prevIncome = prevMonthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const expensePctChange = prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : null;
  const incomePctChange = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : null;

  const totalLimit = activeProfile?.total_limit || 0;
  const limitPct = totalLimit ? Math.min((totalExpense / totalLimit) * 100, 100) : 0;

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const catName = categories.find((c) => c.id === t.category_id)?.name || "Sem categoria";
        map.set(catName, (map.get(catName) || 0) + t.amount);
      });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [monthTransactions, categories]);

  const barData = useMemo(() => {
    const months: { name: string; entradas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTxs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      months.push({
        name: format(d, "MMM", { locale: ptBR }),
        entradas: monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        despesas: monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  const handleAdd = async () => {
    if (!description.trim() || !amount) { toast.error("Preencha todos os campos"); return; }
    await addTransaction({
      type, description,
      amount: parseFloat(amount),
      date: format(date, "yyyy-MM-dd"),
      category_id: type === "expense" ? categoryId || null : null,
      installments: type === "expense" ? parseInt(installments) : null,
      is_recurring: type === "income" ? isRecurring : false,
    });
    toast.success(type === "expense" ? "Despesa registrada!" : "Entrada registrada!");
    setOpen(false);
    setDescription(""); setAmount(""); setCategoryId(""); setInstallments("1"); setIsRecurring(false); setDate(new Date());
  };

  const getCategoryName = (id?: string | null) => !id ? "Sem categoria" : categories.find((c) => c.id === id)?.name || "—";
  const getCategoryIcon = (id?: string | null) => !id ? "💰" : categories.find((c) => c.id === id)?.icon || "💰";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-md">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
            {p.name}: R$ {p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) return <AppLayout><DashboardSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">{format(now, "MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:opacity-90 hidden sm:flex"><Plus className="w-4 h-4 mr-2" /> Nova Transação</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={type === "expense" ? "default" : "outline"} onClick={() => setType("expense")}
                    className={type === "expense" ? "gradient-primary flex-1" : "flex-1"}>Despesa</Button>
                  <Button variant={type === "income" ? "default" : "outline"} onClick={() => setType("income")}
                    className={type === "income" ? "bg-success hover:bg-success/90 flex-1" : "flex-1"}>Entrada</Button>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />{format(date, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setDate(d); setCalendarOpen(false); } }} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
                {type === "expense" && (
                  <>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(() => {
                      if (!categoryId || !amount) return null;
                      const cat = categories.find((c) => c.id === categoryId);
                      if (!cat || !cat.limit) return null;
                      const currentSpent = monthTransactions
                        .filter((t) => t.type === "expense" && t.category_id === categoryId)
                        .reduce((s, t) => s + t.amount, 0);
                      const newTotal = currentSpent + parseFloat(amount || "0");
                      const pct = Math.round((newTotal / cat.limit) * 100);
                      if (pct < 70) return null;
                      return (
                        <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${pct >= 100 ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-warning/50 bg-warning/10 text-warning"}`}>
                          <span>⚠️</span>
                          <span>
                            {pct >= 100
                              ? `Você ultrapassará o limite de ${cat.name} (${pct}% do limite de R$ ${cat.limit.toFixed(2)})`
                              : `Você usará ${pct}% do limite de ${cat.name} com esse lançamento`}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      <Label>Parcelas</Label>
                      <Input type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} min="1" max="48" />
                      {parseInt(installments) > 1 && amount && (
                        <p className="text-sm text-muted-foreground">{installments}x de R$ {(parseFloat(amount) / parseInt(installments)).toFixed(2)}</p>
                      )}
                    </div>
                  </>
                )}
                {type === "income" && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>Entrada Recorrente</Label>
                      <p className="text-xs text-muted-foreground">Marcada como recorrente para referência</p>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                )}
                <Button onClick={handleAdd} className={`w-full ${type === "expense" ? "gradient-primary" : "bg-success hover:bg-success/90"}`}>
                  Registrar {type === "expense" ? "Despesa" : "Entrada"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Saldo", value: balance, icon: Wallet, gradient: "gradient-card", textClass: "text-primary-foreground", subClass: "text-primary-foreground/70" },
            { label: "Entradas", value: totalIncome, icon: TrendingUp, color: "success" },
            { label: "Despesas", value: totalExpense, icon: TrendingDown, color: "destructive" },
            { label: "Limite", value: totalLimit, icon: Target, pct: limitPct },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={item.gradient || ""}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${item.subClass || "text-muted-foreground"}`}>{item.label}</span>
                    <item.icon className={`w-5 h-5 ${item.textClass || (item.color ? `text-${item.color}` : "text-primary")}`} />
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${item.textClass || ""}`}>R$ {item.value.toFixed(2)}</p>
                  {item.pct !== undefined && item.value > 0 && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 rounded-full bg-secondary">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${item.pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.pct.toFixed(0)}% utilizado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Month comparison */}
        {(expensePctChange !== null || incomePctChange !== null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground px-1">
            <span>Comparado ao mês anterior:</span>
            {expensePctChange !== null && (
              <span className={expensePctChange > 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                despesas {expensePctChange > 0 ? "+" : ""}{expensePctChange}%
              </span>
            )}
            {incomePctChange !== null && (
              <span className={incomePctChange >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                entradas {incomePctChange > 0 ? "+" : ""}{incomePctChange}%
              </span>
            )}
          </motion.div>
        )}

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={categories.find(c => c.name === pieData[i].name)?.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} itemStyle={{ color: "hsl(var(--card-foreground))" }} labelStyle={{ color: "hsl(var(--card-foreground))" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                    Nenhuma despesa este mês
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <PremiumGate locked={!canViewBarChart} feature="Gráfico de barras com evolução de 6 meses. Desbloqueie com o Premium para visualizar tendências.">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Entradas vs Despesas (6 meses)
                    {!canViewBarChart && <Crown className="w-4 h-4 text-warning" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="hsl(145, 63%, 42%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </PremiumGate>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-lg shrink-0">
                          {t.type === "income" ? "💵" : getCategoryIcon(t.category_id)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{t.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "dd/MM/yyyy")}
                            {t.current_installment && ` • ${t.current_installment}/${t.installments}x`}
                            {t.is_recurring && " • Recorrente"}
                            {t.type === "expense" && ` • ${getCategoryName(t.category_id)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-semibold text-sm whitespace-nowrap ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                          {t.type === "income" ? "+" : "-"} R$ {t.amount.toFixed(2)}
                        </span>
                        <DeleteConfirmDialog
                          title="Excluir transação"
                          description={`Deseja excluir "${t.description}"? ${t.parent_id ? "Todas as parcelas serão removidas." : "Esta ação não pode ser desfeita."}`}
                          onConfirm={async () => { await deleteTransaction(t.id); toast.success("Transação removida"); }}
                        />
                      </div>
                    </div>
                  ))}
                {monthTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Nenhuma transação este mês</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAB mobile */}
        <div className="sm:hidden fixed bottom-6 right-6 z-30">
          <Button onClick={() => setOpen(true)} className="gradient-primary w-14 h-14 rounded-full shadow-lg hover:opacity-90" size="icon">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </div>
    </AppLayout>
  );
};

export default DashboardPage;