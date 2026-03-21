import React, { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Plus, TrendingUp, TrendingDown, Wallet, Target, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardPage = () => {
  const { activeProfile } = useAuth();
  const { categories, transactions, addTransaction, deleteTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [installments, setInstallments] = useState("1");
  const [isRecurring, setIsRecurring] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const now = new Date();
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalLimit = activeProfile?.total_limit || 0;
  const limitPct = totalLimit ? Math.min((totalExpense / totalLimit) * 100, 100) : 0;

  const handleAdd = async () => {
    if (!description.trim() || !amount) { toast.error("Preencha todos os campos"); return; }
    await addTransaction({
      type,
      description,
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

  const getCategoryName = (id?: string | null) => {
    if (!id) return "Sem categoria";
    return categories.find((c) => c.id === id)?.name || "—";
  };
  const getCategoryIcon = (id?: string | null) => {
    if (!id) return "💰";
    return categories.find((c) => c.id === id)?.icon || "💰";
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">{format(now, "MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> Nova Transação</Button>
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
                    <div><Label>Entrada Recorrente</Label><p className="text-sm text-muted-foreground">Repetir mensalmente</p></div>
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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className={`text-2xl font-bold ${item.textClass || ""}`}>R$ {item.value.toFixed(2)}</p>
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-lg">
                          {t.type === "income" ? "💵" : getCategoryIcon(t.category_id)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
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
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8"
                          onClick={async () => { await deleteTransaction(t.id); toast.success("Transação removida"); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
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
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
