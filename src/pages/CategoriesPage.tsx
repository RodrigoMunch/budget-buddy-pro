import React, { useState } from "react";
import { useFinance, Category } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

const COLORS = ["#5954DD", "#4B47BB", "#5B57E5", "#3D3A99", "#302D77", "#222055", "#e74c3c", "#27ae60", "#f39c12", "#2980b9"];
const ICONS = ["🏠", "🍔", "🚗", "💊", "🎮", "📚", "👗", "✈️", "💡", "📱"];

const CategoriesPage = () => {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: COLORS[0], limit: "0", icon: ICONS[0] });

  const openNew = () => { setEditId(null); setForm({ name: "", color: COLORS[0], limit: "0", icon: ICONS[0] }); setOpen(true); };
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground mt-1">Organize seus gastos por categorias</p>
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={async () => { await deleteCategory(cat.id); toast.success("Categoria removida"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Tags className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma categoria criada ainda</p><p className="text-sm">Clique em "Nova Categoria" para começar</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CategoriesPage;
