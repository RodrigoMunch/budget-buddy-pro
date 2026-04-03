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
import { History, CalendarIcon, Filter, Trash2, X, Crown, Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/utils/exportData";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

type PresetKey = "7d" | "14d" | "30d" | "future" | "custom";

const presets: { key: PresetKey; label: string; premium?: boolean }[] = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "14d", label: "Últimos 14 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "future", label: "Lançamentos futuros" },
  { key: "custom", label: "Personalizado", premium: true },
];

const HistoryPage = () => {
  const { transactions, categories, deleteTransaction } = useFinance();
  const { isPremiumActive, canViewHistory } = usePermissions();
  const [activePreset, setActivePreset] = useState<PresetKey>("30d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
        if (t.type !== "expense") return false;
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
  }, [transactions, activePreset, dateRange, categoryFilter, isPremiumActive]);

  const totalFiltered = filteredTransactions.reduce((s, t) => s + t.amount, 0);
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><History className="w-5 h-5 text-primary-foreground" /></div>
              <div>
                <h1 className="text-3xl font-bold">Histórico de Despesas</h1>
                <p className="text-muted-foreground text-sm">
                  {isPremiumActive ? "Filtre e analise suas despesas" : "Histórico do mês atual (Premium para histórico completo)"}
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
                  <DropdownMenuItem onClick={() => { exportToPDF({ transactions: filteredTransactions, categories, title: "Histórico de Despesas" }); toast.success("PDF exportado!"); }}>
                    <FileText className="w-4 h-4 mr-2" /> Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportToCSV({ transactions: filteredTransactions, categories, title: "historico_despesas" }); toast.success("CSV exportado!"); }}>
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground mb-1">Despesas encontradas</p><p className="text-2xl font-bold">{filteredTransactions.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground mb-1">Total no período</p><p className="text-2xl font-bold text-destructive">R$ {totalFiltered.toFixed(2)}</p></CardContent></Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-lg">Despesas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: getCategoryColor(t.category_id) + "22" }}>{getCategoryIcon(t.category_id)}</div>
                      <div>
                        <p className="font-medium text-sm">{t.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")}</span>
                          {t.current_installment && <Badge variant="outline" className="text-xs py-0 h-5">{t.current_installment}/{t.installments}x</Badge>}
                          <Badge variant="secondary" className="text-xs py-0 h-5">{getCategoryName(t.category_id)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-destructive">- R$ {t.amount.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8"
                        onClick={async () => { await deleteTransaction(t.id); toast.success("Despesa removida"); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground"><History className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Nenhuma despesa encontrada</p><p className="text-sm text-muted-foreground/60 mt-1">Ajuste os filtros ou registre novas despesas</p></div>
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