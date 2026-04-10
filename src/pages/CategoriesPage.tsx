import React, { useState } from "react";
import { useFinance, Category } from "@/contexts/FinanceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import UpgradeModal from "@/components/UpgradeModal";
import { Plus, Pencil, Tags, Crown } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { CardsSkeleton } from "@/components/PageSkeleton";

const COLORS = ["#5954DD", "#4B47BB", "#5B57E5", "#3D3A99", "#302D77", "#222055", "#e74c3c", "#27ae60", "#f39c12", "#2980b9"];
const ICONS = ["🏠", "🍔", "🚗", "💊", "🎮", "📚", "👗", "✈️", "💡", "📱"];

const CategoriesPage = () => {
  const { categories, addCategory, updateCategory, deleteCategory, transactions, loading } = useFinance();
  const { canCreateCategory, categoriesRemaining, isPremiumActive, FREE_LIMITS } = usePermissions();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: COLORS[0], limit: "0", icon: ICONS[0] });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openNew = () => {
    if (!canCreateCategory()) {
      setUpgradeOpen(true);
      return;
    }
    setEditId(null);
    setForm({ name: "", color: COLORS[0], limit: "0", icon: ICONS[0] });
    setOpen(true);
  };

  const openEdit = (cat: Category) => { setEditId(cat.id); setForm({ name: cat.name, color: cat.color, limit: cat.limit.toString(), icon: cat.icon }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    const data = { name: form.name, color: form.color, limit: parseFloat(form.limit) || 0, icon: form.icon };
    if (editId) { await updateCategory(editId, data); toast.success("Categoria atualizada!"); }
    else { await addCategory(data); toast.success("Categoria criada!"); }
    setOpen(false);
  };

  const getCategorySpent = (catId: string) => {
    const now = new Date();
    return transactions
      .filter((t) => t.type === "expense" && t.category_id === catId && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) return <AppLayout><div className="max-w-4xl mx-auto"><CardsSkeleton /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground mt-1">
              Organize seus gastos por categorias
              {!isPremiumActive && (
                <span className="ml-2 text-xs">({categories.length}/{FREE_LIMITS.maxCategories} usadas)</span>
              )}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gradient-primary hover:opacity-90"><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Alimentação" /></div>
                <div className="space-y-2"><Label>Ícone</Label>
                  <div className="flex gap-2 flex-wrap">
                    {ICONS.map((icon) => (
                      <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                        className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${form.icon === icon ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>{icon}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label>Limite Mensal (R$)</Label><Input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} min="0" step="0.01" /></div>
                <Button onClick={handleSave} className="w-full gradient-primary hover:opacity-90">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Limit warning banner */}
        {!isPremiumActive && categoriesRemaining() <= 1 && categoriesRemaining() > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3 text-sm">
              <Crown className="w-4 h-4 text-warning shrink-0" />
              <span>Você pode criar mais <strong>{categoriesRemaining()}</strong> categoria(s). Desbloqueie ilimitadas com o Premium!</span>
              <Button size="sm" variant="ghost" className="ml-auto text-warning shrink-0" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat, i) => {
            const spent = getCategorySpent(cat.id);
            const pct = cat.limit > 0 ? Math.min((spent / cat.limit) * 100, 100) : 0;
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color + "20" }}>{cat.icon}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{cat.name}</h3>
                          {cat.limit > 0 && <p className="text-sm text-muted-foreground">R$ {spent.toFixed(2)} / R$ {cat.limit.toFixed(2)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(cat)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Excluir categoria"
                          description={`Deseja excluir a categoria "${cat.name}"? As transações associadas perderão a categoria.`}
                          onConfirm={async () => { await deleteCategory(cat.id); toast.success("Categoria removida"); }}
                          triggerClassName="opacity-0 group-hover:opacity-100 h-8 w-8"
                          iconClassName="w-3.5 h-3.5 text-destructive"
                        />
                      </div>
                    </div>
                    {cat.limit > 0 && (
                      <div className="mt-4">
                        <div className="w-full h-2 rounded-full bg-secondary">
                          <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "hsl(var(--destructive))" : cat.color }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {categories.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Tags className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Nenhuma categoria ainda</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">Crie categorias para organizar seus gastos e definir limites mensais</p>
                  <Button onClick={openNew} className="gradient-primary hover:opacity-90"><Plus className="w-4 h-4 mr-2" />Criar primeira categoria</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} feature={`Você usou ${categories.length}/${FREE_LIMITS.maxCategories} categorias. Com o Premium, crie categorias ilimitadas!`} />
      </div>
    </AppLayout>
  );
};

export default CategoriesPage;