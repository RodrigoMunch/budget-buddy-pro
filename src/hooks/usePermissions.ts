import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";

const FREE_LIMITS = {
  maxCategories: 5,
  maxActiveInstallments: 3,
  historyCurrentMonthOnly: true,
  barChartLocked: true,
  exportLocked: true,
  goalsLocked: true,
};

export const usePermissions = () => {
  const { activeProfile, isAdmin } = useAuth();
  const { categories, transactions } = useFinance();

  const plan = activeProfile?.plan || "free";
  const planExpiresAt = activeProfile?.plan_expires_at
    ? new Date(activeProfile.plan_expires_at)
    : null;
  const trialUsed = activeProfile?.trial_used ?? false;

  const now = new Date();
  const gracePeriodDays = 3;

  // Check if premium is active (including grace period)
  const isPremiumActive = (() => {
    if (isAdmin) return true;
    if (plan !== "premium") return false;
    if (!planExpiresAt) return true; // no expiry = lifetime
    const graceEnd = new Date(planExpiresAt);
    graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);
    return now <= graceEnd;
  })();

  // Trial info
  const isTrialActive = (() => {
    if (plan !== "premium" || !planExpiresAt) return false;
    return now <= planExpiresAt && !trialUsed;
  })();

  const trialDaysRemaining = (() => {
    if (!isTrialActive || !planExpiresAt) return 0;
    const diff = planExpiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  // Permission checks
  const canCreateCategory = () => {
    if (isPremiumActive) return true;
    return categories.length < FREE_LIMITS.maxCategories;
  };

  const categoriesRemaining = () => {
    if (isPremiumActive) return Infinity;
    return Math.max(0, FREE_LIMITS.maxCategories - categories.length);
  };

  const canCreateInstallment = () => {
    if (isPremiumActive) return true;
    const activeInstallmentGroups = new Set<string>();
    transactions.forEach((t) => {
      if (t.parent_id && t.installments && t.installments > 1) {
        const futureInstallments = transactions.filter(
          (tr) => tr.parent_id === t.parent_id && new Date(tr.date) >= now
        );
        if (futureInstallments.length > 0) {
          activeInstallmentGroups.add(t.parent_id);
        }
      }
    });
    return activeInstallmentGroups.size < FREE_LIMITS.maxActiveInstallments;
  };

  const activeInstallmentsCount = () => {
    const activeGroups = new Set<string>();
    transactions.forEach((t) => {
      if (t.parent_id && t.installments && t.installments > 1) {
        const futureInstallments = transactions.filter(
          (tr) => tr.parent_id === t.parent_id && new Date(tr.date) >= now
        );
        if (futureInstallments.length > 0) {
          activeGroups.add(t.parent_id);
        }
      }
    });
    return activeGroups.size;
  };

  const canViewHistory = (month: Date) => {
    if (isPremiumActive) return true;
    return (
      month.getMonth() === now.getMonth() &&
      month.getFullYear() === now.getFullYear()
    );
  };

  const canViewBarChart = isPremiumActive;
  const canExport = isPremiumActive;
  const canUseGoals = isPremiumActive;

  return {
    isPremiumActive,
    isTrialActive,
    trialDaysRemaining,
    plan,
    canCreateCategory,
    categoriesRemaining,
    canCreateInstallment,
    activeInstallmentsCount,
    canViewHistory,
    canViewBarChart,
    canExport,
    canUseGoals,
    FREE_LIMITS,
  };
};
