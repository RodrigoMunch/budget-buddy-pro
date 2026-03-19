import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface Category {
  id: string;
  name: string;
  color: string;
  limit: number;
  icon: string;
}

export interface Transaction {
  id: string;
  type: "expense" | "income";
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  installments?: number;
  currentInstallment?: number;
  parentId?: string;
  isRecurring?: boolean;
}

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  addCategory: (cat: Omit<Category, "id">) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const key = (k: string) => `finapp_${user?.id}_${k}`;

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      setCategories(JSON.parse(localStorage.getItem(key("categories")) || "[]"));
      setTransactions(JSON.parse(localStorage.getItem(key("transactions")) || "[]"));
    } else {
      setCategories([]);
      setTransactions([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) localStorage.setItem(key("categories"), JSON.stringify(categories));
  }, [categories, user]);

  useEffect(() => {
    if (user) localStorage.setItem(key("transactions"), JSON.stringify(transactions));
  }, [transactions, user]);

  const addCategory = (cat: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...cat, id: crypto.randomUUID() }]);
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addTransaction = (t: Omit<Transaction, "id">) => {
    if (t.type === "expense" && t.installments && t.installments > 1) {
      const parentId = crypto.randomUUID();
      const perInstallment = t.amount / t.installments;
      const baseDate = new Date(t.date);
      const newTransactions: Transaction[] = [];
      for (let i = 0; i < t.installments; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        newTransactions.push({
          ...t,
          id: crypto.randomUUID(),
          amount: Math.round(perInstallment * 100) / 100,
          date: d.toISOString().split("T")[0],
          currentInstallment: i + 1,
          parentId: i === 0 ? undefined : parentId,
        });
      }
      newTransactions[0].parentId = parentId;
      setTransactions((prev) => [...prev, ...newTransactions]);
    } else {
      setTransactions((prev) => [...prev, { ...t, id: crypto.randomUUID() }]);
    }
  };

  const deleteTransaction = (id: string) => {
    const t = transactions.find((tr) => tr.id === id);
    if (t?.parentId) {
      setTransactions((prev) => prev.filter((tr) => tr.parentId !== t.parentId));
    } else {
      setTransactions((prev) => prev.filter((tr) => tr.id !== id));
    }
  };

  return (
    <FinanceContext.Provider value={{ categories, transactions, addCategory, updateCategory, deleteCategory, addTransaction, deleteTransaction }}>
      {children}
    </FinanceContext.Provider>
  );
};
