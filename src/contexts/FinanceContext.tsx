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
  investment_wallet_id?: string | null;
}

export interface InvestmentWallet {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  wallets: InvestmentWallet[];
  loading: boolean;
  addCategory: (cat: Omit<Category, "id" | "user_id">) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, "id" | "user_id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (w: Omit<InvestmentWallet, "id" | "user_id">) => Promise<void>;
  updateWallet: (id: string, w: Partial<InvestmentWallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addContribution: (walletId: string, amount: number, date: string, description?: string) => Promise<void>;
  addWithdrawal: (walletId: string, amount: number, date: string, description?: string) => Promise<void>;
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
  const [wallets, setWallets] = useState<InvestmentWallet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeUserId) {
      setCategories([]);
      setTransactions([]);
      setWallets([]);
      return;
    }
    setLoading(true);
    const [catRes, txRes, walletRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", activeUserId),
      supabase.from("transactions").select("*").eq("user_id", activeUserId),
      supabase.from("investment_wallets").select("*").eq("user_id", activeUserId),
    ]);
    if (catRes.data) setCategories(catRes.data.map((c: any) => ({ ...c, limit: Number(c.limit) })));
    if (txRes.data) setTransactions(txRes.data.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
      type: t.type as "expense" | "income",
    })));
    if (walletRes.data) setWallets(walletRes.data as InvestmentWallet[]);
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

  const addWallet = async (w: Omit<InvestmentWallet, "id" | "user_id">) => {
    if (!user?.id) return;
    await supabase.from("investment_wallets").insert({
      user_id: user.id,
      name: w.name,
      type: w.type,
      color: w.color,
      icon: w.icon,
    });
    await fetchData();
  };

  const updateWallet = async (id: string, w: Partial<InvestmentWallet>) => {
    await supabase.from("investment_wallets").update({
      name: w.name,
      type: w.type,
      color: w.color,
      icon: w.icon,
    }).eq("id", id);
    await fetchData();
  };

  const deleteWallet = async (id: string) => {
    await supabase.from("investment_wallets").delete().eq("id", id);
    await fetchData();
  };

  const addContribution = async (walletId: string, amount: number, date: string, description?: string) => {
    if (!user?.id) return;
    const wallet = wallets.find((w) => w.id === walletId);
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      description: description?.trim() || `Aporte - ${wallet?.name || "Investimento"}`,
      amount,
      date,
      category_id: null,
      investment_wallet_id: walletId,
      is_recurring: false,
    });
    await fetchData();
  };

  const addWithdrawal = async (walletId: string, amount: number, date: string, description?: string) => {
    if (!user?.id) return;
    const wallet = wallets.find((w) => w.id === walletId);
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "income",
      description: description?.trim() || `Resgate - ${wallet?.name || "Investimento"}`,
      amount,
      date,
      category_id: null,
      investment_wallet_id: walletId,
      is_recurring: false,
    });
    await fetchData();
  };

  return (
    <FinanceContext.Provider value={{
      categories, transactions, wallets, loading,
      addCategory, updateCategory, deleteCategory,
      addTransaction, deleteTransaction,
      addWallet, updateWallet, deleteWallet,
      addContribution, addWithdrawal,
      refresh: fetchData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
