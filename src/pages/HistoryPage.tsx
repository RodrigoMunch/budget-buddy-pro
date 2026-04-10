import React, { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import UpgradeModal from "@/components/UpgradeModal";
import { History, CalendarIcon, Filter, X, Crown, Download, FileText, FileSpreadsheet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { ListSkeleton } from "@/components/PageSkeleton";
import { exportToPDF, exportToCSV } from "@/utils/exportData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

type PresetKey = "7d" | "14d" | "30d" | "future" | "custom";
type TypeFilter = "all" | "expense" | "income";

const presets: { key: PresetKey; label: string; premium?: boolean }[] = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "14d", label: "Últimos 14 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "future", label: "Lançamentos futuros" },
  { key: "custom", label: "Personalizado", premium: true },
];

const HistoryPage = () => {
  const { transactions, categories, deleteTransaction, loading } = useFinance();
  const { isPremiumActive, canViewHistory } = usePermissions();
  const [activePreset, setActivePreset] = useState<PresetKey>("30d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const today = new Date();
    switch (activePreset) {
      case "7d": return { from: subDays(today, 7), to: today };
      case "14d": return { from: subDays(today, 14), to: today };
      case "30d": return { from: subDays(today, 30), to: today };
      case "future": return { from: startOfDay(new Date(today.getTime() + 86400000)), to: null };
      case "custom": return { from: dateRange?.from || null, to: dateRange?.to || null };
      default: return { from: null, to: null };
    }
  };

  const filteredTransactions = useMemo(() => {
    const { from, to } = getDateRange();
    const now = new Date();
    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== "all" && t.type !== typeFilter) return false;

        const d = new Date(t.date);

        // Free plan: only current month
        if (!isPremiumActive) {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }

        if (from && isBefore(d, startOfDay(from))) return false;
        if (to && isAfter(d, endOfDay(to))) return false;
        if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activePreset, dateRange, categoryFilter, typeFilter, isPremiumActive]);

  const totalExpenses = filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const getCategoryName = (id?: string | null) => categories.find((c) => c.id === id)?.name || "Sem categoria";
  const getCategoryIcon = (id?: string | null) => categories.find((c) => c.id === id)?.icon || "💰";
  const getCategoryColor = (id?: string | null) => categories.find((c) => c.id === id)?.color || "#6c5ce7";

  const handlePreset = (key: PresetKey) => {
    if (!isPremiumActive && (key === "custom" || key === "14d")) {
      setUpgradeOpen(true);
      return;
    }
    setActivePreset(key);
    if (key !== "custom") setDateRange(undefined);
  };

  const exportTitle = typeFilter === "income" ? "Histórico de Entradas" : typeFilter === "expense" ? "Histórico de Despesas" : "Histórico de Transações";
  const exportFileName = typeFilter === "income" ? "historico_entradas" : typeFilter === "expense" ? "historico_despesas" : "historico_transacoes";

  if (loading) return <AppLayout><ListSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><History className="w-5 h-5 text-primary-foreground" /></div>
              <div>
                <h1 className="text-3xl font-bold">Histórico</h1>
                <p className="text-muted-foreground text-sm">
                  {isPremiumActive ? "Filtre e analise suas transações" : "Histórico do mês atual (Premium para histórico completo)"}
                </p>
              </div>
            </div>
            {isPremiumActive ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={filteredTransactions.length === 0}>
                    <Download className="w-4 h-4 mr-2" /> Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { exportToPDF({ transactions: filteredTransactions, categories, title: exportTitle }); toast.success("PDF exportado!"); }}>
                    <FileText className="w-4 h-4 mr-2" /> Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportToCSV({ transactions: filteredTransactions, categories, title: exportFileName }); toast.success("CSV exportado!"); }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
                <Crown className="w-4 h-4 mr-2 text-warning" /> Exportar
              </Button>
            )}
          </div>
        </motion.div>

        {!isPremiumActive && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
              <Crown className="w-4 h-4 text-primary shrink-0" />
              <span>No plano gratuito, o histórico é limitado ao mês atual. <strong>Desbloqueie todos os meses</strong> com o Premium.</span>
              <Button size="sm" variant="ghost" className="ml-auto text-primary shrink-0" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2"><Filter className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Filtros</span></div>
              
              {/* Type filter */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={typeFilter === "all" ? "default" : "outline"}
                  className={typeFilter === "all" ? "gradient-primary text-primary-foreground" : ""}
                  onClick={() => setTypeFilter("all")}>
                  Todas
                </Button>
                <Button size="sm" variant={typeFilter === "expense" ? "default" : "outline"}
                  className={typeFilter === "expense" ? "gradient-primary text-primary-foreground" : ""}
                  onClick={() => setTypeFilter("expense")}>
                  <ArrowDownCircle className="w-3.5 h-3.5 mr-1" /> Despesas
                </Button>
                <Button size="sm" variant={typeFilter === "income" ? "default" : "outline"}
                  className={typeFilter === "income" ? "gradient-primary text-primary-foreground" : ""}
                  onClick={() => setTypeFilter("income")}>
                  <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Entradas
                </Button>
              </div>

              {/* Date presets */}
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button key={p.key} size="sm" variant={activePreset === p.key ? "default" : "outline"}
                    className={`${activePreset === p.key ? "gradient-primary text-primary-foreground" : ""} ${p.premium && !isPremiumActive ? "opacity-70" : ""}`}
                    onClick={() => handlePreset(p.key)}>
                    {p.label}
                    {p.premium && !isPremiumActive && <Crown className="w-3 h-3 ml-1 text-warning" />}
                  </Button>
                ))}
              </div>
              {activePreset === "custom" && isPremiumActive && (
                <div className="flex items-center gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start min-w-[260px]">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "dd/MM/yyyy")} — {format(dateRange.to, "dd/MM/yyyy")}</> : format(dateRange.from, "dd/MM/yyyy")) : <span className="text-muted-foreground">Selecione o período</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                  {dateRange && <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}><X className="w-4 h-4" /></Button>}
                </div>
              )}
              <div className="flex items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {categoryFilter !== "all" && <Button variant="ghost" size="sm" onClick={() => setCategoryFilter("all")}><X className="w-3 h-3 mr-1" /> Limpar</Button>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground mb-1">Transações encontradas</p><p className="text-2xl font-bold">{filteredTransactions.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground mb-1">Total em despesas</p><p className="text-2xl font-bold text-destructive">R$ {totalExpenses.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground mb-1">Total em entradas</p><p className="text-2xl font-bold text-emerald-500">R$ {totalIncome.toFixed(2)}</p></CardContent></Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-lg">Transações</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: isIncome ? "#10b98122" : getCategoryColor(t.category_id) + "22" }}>
                          {isIncome ? "💵" : getCategoryIcon(t.category_id)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")}</span>
                            {t.current_installment && <Badge variant="outline" className="text-xs py-0 h-5">{t.current_installment}/{t.installments}x</Badge>}
                            {isIncome ? (
                              <Badge variant="secondary" className="text-xs py-0 h-5 bg-emerald-500/10 text-emerald-600">Entrada</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs py-0 h-5">{getCategoryName(t.category_id)}</Badge>
                            )}
                            {t.is_recurring && <Badge variant="outline" className="text-xs py-0 h-5">Recorrente</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isIncome ? "text-emerald-500" : "text-destructive"}`}>
                          {isIncome ? "+" : "-"} R$ {t.amount.toFixed(2)}
                        </span>
                        <DeleteConfirmDialog
                          title={isIncome ? "Excluir entrada" : "Excluir despesa"}
                          description={`Deseja excluir "${t.description}"? ${t.parent_id ? "Todas as parcelas serão removidas." : "Esta ação não pode ser desfeita."}`}
                          onConfirm={async () => { await deleteTransaction(t.id); toast.success(isIncome ? "Entrada removida" : "Despesa removida"); }}
                        />
                      </div>
                    </div>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <History className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Nenhuma transação encontrada</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">Ajuste os filtros ou registre novas transações no Dashboard</p>
                    <Button onClick={() => window.location.href = '/dashboard'} className="gradient-primary hover:opacity-90">Ir para o Dashboard</Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} feature="Desbloqueie o histórico completo com todos os meses, filtros avançados e período personalizado." />
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
