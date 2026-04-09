import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DollarSign, FolderOpen, Target, ArrowRight, ArrowLeft, Check } from "lucide-react";

const SUGGESTED_CATEGORIES = [
  { name: "Alimentação", icon: "🍔", color: "#F97316" },
  { name: "Transporte", icon: "🚗", color: "#3B82F6" },
  { name: "Moradia", icon: "🏠", color: "#8B5CF6" },
  { name: "Saúde", icon: "💊", color: "#EF4444" },
  { name: "Educação", icon: "📚", color: "#10B981" },
  { name: "Lazer", icon: "🎮", color: "#EC4899" },
  { name: "Roupas", icon: "👕", color: "#F59E0B" },
  { name: "Assinaturas", icon: "📱", color: "#6366F1" },
  { name: "Pets", icon: "🐾", color: "#A855F7" },
  { name: "Investimentos", icon: "📈", color: "#059669" },
];

const GOALS = [
  { id: "save", label: "Economizar dinheiro", icon: "💰" },
  { id: "control", label: "Controlar gastos", icon: "📊" },
  { id: "debt", label: "Sair das dívidas", icon: "🎯" },
  { id: "invest", label: "Começar a investir", icon: "📈" },
];

const OnboardingPage = () => {
  const { user, updateProfile } = useAuth();
  const { addCategory } = useFinance();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([0, 1, 2]);
  const [selectedGoal, setSelectedGoal] = useState<string>("control");
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (idx: number) => {
    setSelectedCategories((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleFinish = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      // 1. Set total_limit from income
      const monthlyIncome = parseFloat(income) || 0;
      if (monthlyIncome > 0) {
        await updateProfile({ total_limit: monthlyIncome });

        // Create recurring income transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          type: "income",
          description: "Renda mensal",
          amount: monthlyIncome,
          date: new Date().toISOString().split("T")[0],
          is_recurring: true,
        });
      }

      // 2. Create selected categories
      for (const idx of selectedCategories) {
        const cat = SUGGESTED_CATEGORIES[idx];
        await addCategory({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          limit: 0,
        });
      }

      // 3. Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("user_id", user.id);

      toast.success("Tudo pronto! Bem-vindo ao FinControl 🎉");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Erro ao finalizar configuração");
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return parseFloat(income) > 0;
    if (step === 2) return selectedCategories.length > 0;
    return !!selectedGoal;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? "w-10 bg-primary" : s < step ? "w-10 bg-success" : "w-10 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                      <DollarSign className="w-7 h-7 text-success" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">Qual sua renda mensal?</h2>
                    <p className="text-sm text-muted-foreground">
                      Isso nos ajuda a definir seu limite de gastos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Renda mensal (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5000"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      min="0"
                      step="100"
                      className="text-lg h-12"
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canAdvance()}
                    className="w-full h-11"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <FolderOpen className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">Quais categorias você usa?</h2>
                    <p className="text-sm text-muted-foreground">
                      Selecione as que fazem sentido para você
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED_CATEGORIES.map((cat, idx) => {
                      const selected = selectedCategories.includes(idx);
                      return (
                        <button
                          key={cat.name}
                          onClick={() => toggleCategory(idx)}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left text-sm font-medium ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                          {selected && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canAdvance()}
                      className="flex-1 h-11"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-2">
                      <Target className="w-7 h-7 text-warning" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">Qual seu principal objetivo?</h2>
                    <p className="text-sm text-muted-foreground">
                      Isso nos ajuda a personalizar sua experiência
                    </p>
                  </div>
                  <div className="space-y-2">
                    {GOALS.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedGoal === goal.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <span className="text-2xl">{goal.icon}</span>
                        <span className="font-medium">{goal.label}</span>
                        {selectedGoal === goal.id && (
                          <Check className="w-5 h-5 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handleFinish}
                      disabled={submitting || !canAdvance()}
                      className="flex-1 h-11 bg-success hover:bg-success/90"
                    >
                      {submitting ? "Configurando..." : "Concluir"}
                      <Check className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
