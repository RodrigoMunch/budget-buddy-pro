import React, { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { RefreshCw, CalendarRange, TrendingUp, Trash2, Pencil, DollarSign } from "lucide-react";
import { format, addMonths, startOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const RecurringIncomePage = () => {
  const { transactions, refresh } = useFinance();
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const recurringIncomes = useMemo(
    () => transactions.filter((t) => t.type === "income" && t.is_recurring),
    [transactions]
  );

  const now = new Date();
  const projectionMonths = 12;

  const months = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < projectionMonths; i++) {
      result.push(startOfMonth(addMonths(now, i)));
    }
    return result;
  }, []);

  const totalMonthly = recurringIncomes.reduce((sum, t) => sum + t.amount, 0);

  const monthlyProjection = useMemo(() => {
    return months.map((month) => {
      let total = 0;
      recurringIncomes.forEach((t) => {
        const tDate = new Date(t.date);
        // Recurring income applies from its start date onward
        if (startOfMonth(tDate) <= month) {
          total += t.amount;
        }
      });
      return total;
    });
  }, [months, recurringIncomes]);

  const handleEdit = (t: typeof recurringIncomes[0]) => {
    setEditingId(t.id);
    setEditDesc(t.description);
    setEditAmount(t.amount.toString());
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDesc.trim() || !editAmount) return;
    const { error } = await supabase
      .from("transactions")
      .update({ description: editDesc, amount: parseFloat(editAmount) })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao atualizar entrada");
    } else {
      toast.success("Entrada atualizada!");
      await refresh();
      setEditOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover entrada");
    } else {
      toast.success("Entrada recorrente removida!");
      await refresh();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Entradas Recorrentes</h1>
              <p className="text-muted-foreground text-sm">
                Gerencie suas receitas recorrentes e veja a projeção futura
              </p>
            </div>
          </div>
        </motion.div>

        {recurringIncomes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-16 text-center">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhuma entrada recorrente encontrada</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Registre uma entrada com a opção "Recorrente" no Dashboard
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Summary cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid gap-4 grid-cols-1 sm:grid-cols-3"
            >
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-1">Entradas Recorrentes</p>
                  <p className="text-2xl font-bold">{recurringIncomes.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-1">Total Mensal Estimado</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {totalMonthly.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarRange className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Projeção Anual</p>
                  </div>
                  <p className="text-2xl font-bold text-success">
                    R$ {monthlyProjection.reduce((a, b) => a + b, 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* List of recurring incomes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suas Entradas Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recurringIncomes.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-lg shrink-0">
                            💵
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{t.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Desde {format(new Date(t.date), "dd/MM/yyyy")} • Recorrente
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-sm text-success whitespace-nowrap">
                            R$ {t.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Projection table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Projeção de Receita (12 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">
                          Descrição
                        </TableHead>
                        <TableHead className="min-w-[100px]">Valor</TableHead>
                        {months.map((m) => (
                          <TableHead
                            key={m.toISOString()}
                            className="min-w-[110px] text-right capitalize"
                          >
                            {format(m, "MMM/yy", { locale: ptBR })}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringIncomes.map((t) => {
                        const startMonth = startOfMonth(new Date(t.date));
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium sticky left-0 bg-card z-10">
                              <div className="flex items-center gap-2">
                                <span>💵</span>
                                <span>{t.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                R$ {t.amount.toFixed(2)}
                              </Badge>
                            </TableCell>
                            {months.map((month) => {
                              const applies = startMonth <= month;
                              const isPast =
                                month < startOfMonth(now) ||
                                isSameMonth(month, now);
                              return (
                                <TableCell
                                  key={month.toISOString()}
                                  className="text-right"
                                >
                                  {applies ? (
                                    <span
                                      className={`text-sm font-medium ${
                                        isPast
                                          ? "text-muted-foreground"
                                          : "text-success"
                                      }`}
                                    >
                                      R$ {t.amount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold border-t-2">
                        <TableCell className="sticky left-0 bg-card z-10">
                          Total
                        </TableCell>
                        <TableCell />
                        {monthlyProjection.map((total, i) => (
                          <TableCell
                            key={i}
                            className="text-right text-success"
                          >
                            R$ {total.toFixed(2)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Entrada Recorrente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleSaveEdit}
                className="w-full bg-success hover:bg-success/90"
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default RecurringIncomePage;
