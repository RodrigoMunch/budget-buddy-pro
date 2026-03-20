import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  limit: number;
  icon: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: "expense" | "income";
  description: string;
  amount: number;
  date: string;
  category_id?: string | null;
  installments?: number | null;
  current_installment?: number | null;
  parent_id?: string | null;
  is_recurring?: boolean;
}

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  addCategory: (cat: Omit<Category, "id" | "user_id">) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "user_id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { activeUserId, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeUserId) {
      setCategories([]);
      setTransactions([]);
      return;
    }
    setLoading(true);
    const [catRes, txRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", activeUserId),
      supabase.from("transactions").select("*").eq("user_id", activeUserId),
    ]);
    if (catRes.data) setCategories(catRes.data.map((c: any) => ({ ...c, limit: Number(c.limit) })));
    if (txRes.data) setTransactions(txRes.data.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
      type: t.type as "expense" | "income",
    })));
    setLoading(false);
  }, [activeUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addCategory = async (cat: Omit<Category, "id" | "user_id">) => {
    if (!user?.id) return;
    await supabase.from("categories").insert({
      user_id: user.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      limit: cat.limit,
    });
    await fetchData();
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    await supabase.from("categories").update({
      name: data.name,
      color: data.color,
      icon: data.icon,
      limit: data.limit,
    }).eq("id", id);
    await fetchData();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    await fetchData();
  };

  const addTransaction = async (t: Omit<Transaction, "id" | "user_id">) => {
    if (!user?.id) return;
    if (t.type === "expense" && t.installments && t.installments > 1) {
      const parentId = crypto.randomUUID();
      const perInstallment = t.amount / t.installments;
      const baseDate = new Date(t.date);
      const rows = [];
      for (let i = 0; i < t.installments; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        rows.push({
          user_id: user.id,
          type: t.type,
          description: t.description,
          amount: Math.round(perInstallment * 100) / 100,
          date: d.toISOString().split("T")[0],
          category_id: t.category_id || null,
          installments: t.installments,
          current_installment: i + 1,
          parent_id: parentId,
          is_recurring: false,
        });
      }
      await supabase.from("transactions").insert(rows);
    } else {
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        date: t.date,
        category_id: t.category_id || null,
        installments: t.installments || null,
        current_installment: t.current_installment || null,
        parent_id: t.parent_id || null,
        is_recurring: t.is_recurring || false,
      });
    }
    await fetchData();
  };

  const deleteTransaction = async (id: string) => {
    const t = transactions.find((tr) => tr.id === id);
    if (t?.parent_id) {
      await supabase.from("transactions").delete().eq("parent_id", t.parent_id);
    } else {
      await supabase.from("transactions").delete().eq("id", id);
    }
    await fetchData();
  };

  return (
    <FinanceContext.Provider value={{
      categories, transactions, loading,
      addCategory, updateCategory, deleteCategory,
      addTransaction, deleteTransaction, refresh: fetchData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
