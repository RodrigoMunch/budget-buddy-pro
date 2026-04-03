import React, { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import UpgradeModal from "@/components/UpgradeModal";
import { CreditCard, CalendarRange, Crown } from "lucide-react";
import { format, addMonths, startOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const InstallmentsPage = () => {
  const { transactions, categories } = useFinance();
  const { isPremiumActive, activeInstallmentsCount, FREE_LIMITS } = usePermissions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const installmentGroups = new Map<string, typeof transactions>();
  transactions.forEach((t) => {
    if (t.parent_id && t.installments && t.installments > 1) {
      const group = installmentGroups.get(t.parent_id) || [];
      group.push(t);
      installmentGroups.set(t.parent_id, group);
    }
  });

  const now = new Date();
  const currentMonth = startOfMonth(now);
  let maxDate = currentMonth;

  installmentGroups.forEach((group) => {
    group.forEach((t) => { const d = new Date(t.date); if (d > maxDate) maxDate = d; });
  });

  const months: Date[] = [];
  let cursor = startOfMonth(now);
  while (cursor <= startOfMonth(maxDate)) { months.push(new Date(cursor)); cursor = addMonths(cursor, 1); }
  if (months.length === 0) months.push(currentMonth);

  const getCategoryName = (id?: string | null) => categories.find((c) => c.id === id)?.name || "—";
  const getCategoryIcon = (id?: string | null) => categories.find((c) => c.id === id)?.icon || "💳";

  const groupEntries = Array.from(installmentGroups.entries()).sort((a, b) => {
    const aFirst = a[1].sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())[0];
    const bFirst = b[1].sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())[0];
    return new Date(aFirst.date).getTime() - new Date(bFirst.date).getTime();
  });

  const monthlyTotals = months.map((month) => {
    let total = 0;
    installmentGroups.forEach((group) => { group.forEach((t) => { if (isSameMonth(new Date(t.date), month)) total += t.amount; }); });
    return total;
  });

  const activeCount = activeInstallmentsCount();

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center"><CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" /></div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Parcelamentos</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Projeção de parcelas futuras
                {!isPremiumActive && ` (${activeCount}/${FREE_LIMITS.maxActiveInstallments} ativos)`}
              </p>
            </div>
          </div>
        </motion.div>

        {!isPremiumActive && activeCount >= FREE_LIMITS.maxActiveInstallments && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3 text-sm">
              <Crown className="w-4 h-4 text-warning shrink-0" />
              <span>Você atingiu o limite de <strong>{FREE_LIMITS.maxActiveInstallments} parcelamentos ativos</strong>. Desbloqueie ilimitados com o Premium!</span>
              <Button size="sm" variant="ghost" className="ml-auto text-warning shrink-0" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
            </div>
          </motion.div>
        )}

        {groupEntries.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card><CardContent className="py-16 text-center"><CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum parcelamento encontrado</p><p className="text-sm text-muted-foreground/60 mt-1">Registre uma despesa parcelada no Dashboard</p></CardContent></Card>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid gap-3 sm:gap-4 grid-cols-3">
              <Card><CardContent className="p-3 sm:p-5"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Parcelamentos Ativos</p><p className="text-lg sm:text-2xl font-bold">{groupEntries.length}</p></CardContent></Card>
              <Card><CardContent className="p-3 sm:p-5"><p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Este Mês</p><p className="text-lg sm:text-2xl font-bold text-destructive">R$ {monthlyTotals[0]?.toFixed(2) || "0.00"}</p></CardContent></Card>
              <Card><CardContent className="p-3 sm:p-5"><div className="flex items-center gap-1 sm:gap-2 mb-1"><CalendarRange className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /><p className="text-xs sm:text-sm text-muted-foreground">Projeção até</p></div><p className="text-lg sm:text-2xl font-bold capitalize">{format(maxDate, "MMM/yyyy", { locale: ptBR })}</p></CardContent></Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle className="text-lg">Projeção Mensal</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">Descrição</TableHead>
                        <TableHead className="min-w-[120px]">Categoria</TableHead>
                        <TableHead className="min-w-[80px] text-center">Parcelas</TableHead>
                        {months.map((m) => (<TableHead key={m.toISOString()} className="min-w-[110px] text-right capitalize">{format(m, "MMM/yy", { locale: ptBR })}</TableHead>))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupEntries.map(([parentId, group]) => {
                        const sorted = [...group].sort((a, b) => (a.current_installment || 0) - (b.current_installment || 0));
                        const first = sorted[0];
                        const totalInstallments = first.installments || sorted.length;
                        const paid = sorted.filter((t) => new Date(t.date) <= now).length;
                        return (
                          <TableRow key={parentId}>
                            <TableCell className="font-medium sticky left-0 bg-card z-10"><div className="flex items-center gap-2"><span>{getCategoryIcon(first.category_id)}</span><span>{first.description}</span></div></TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{getCategoryName(first.category_id)}</Badge></TableCell>
                            <TableCell className="text-center"><span className="text-sm">{paid}/{totalInstallments}</span></TableCell>
                            {months.map((month) => {
                              const match = sorted.find((t) => isSameMonth(new Date(t.date), month));
                              const isPast = month < currentMonth;
                              return (
                                <TableCell key={month.toISOString()} className="text-right">
                                  {match ? (
                                    <span className={`text-sm font-medium ${isPast || (isSameMonth(month, now) && new Date(match.date) <= now) ? "text-muted-foreground line-through" : "text-destructive"}`}>
                                      R$ {match.amount.toFixed(2)}<span className="text-xs text-muted-foreground ml-1">({match.current_installment}/{totalInstallments})</span>
                                    </span>
                                  ) : <span className="text-muted-foreground/30">—</span>}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold border-t-2">
                        <TableCell className="sticky left-0 bg-card z-10">Total</TableCell><TableCell /><TableCell />
                        {monthlyTotals.map((total, i) => (<TableCell key={i} className="text-right text-destructive">R$ {total.toFixed(2)}</TableCell>))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} feature={`Você atingiu o limite de ${FREE_LIMITS.maxActiveInstallments} parcelamentos ativos. Com o Premium, crie parcelamentos ilimitados!`} />
      </div>
    </AppLayout>
  );
};

export default InstallmentsPage;