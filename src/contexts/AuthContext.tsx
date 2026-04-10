import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  total_limit: number;
  plan: "free" | "premium";
  plan_expires_at: string | null;
  trial_used: boolean;
  plan_started_at: string | null;
  onboarding_completed: boolean;
}

interface SubscriptionInfo {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  impersonating: Profile | null;
  subscription: SubscriptionInfo | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  impersonateUser: (email: string) => Promise<{ error?: string }>;
  stopImpersonating: () => void;
  checkSubscription: () => Promise<void>;
  activeProfile: Profile | null;
  activeUserId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const activeProfile = impersonating || profile;
  const activeUserId = impersonating?.user_id || user?.id || null;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setIsAdmin(data?.some((r: any) => r.role === "admin") || false);
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Check subscription error:", error);
        return;
      }
      if (data) {
        setSubscription(data as SubscriptionInfo);
        // Refresh profile to get updated plan
        if (user?.id) {
          await fetchProfile(user.id);
        }
      }
    } catch (err) {
      console.error("Check subscription error:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            await fetchRole(session.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setImpersonating(null);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() =>
          fetchRole(session.user.id).then(() => setLoading(false))
        );
      } else {
        setLoading(false);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  // Check subscription on login and periodically
  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000); // every minute
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check subscription on URL params (after checkout redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success" && user) {
      // Delay to allow Stripe webhook processing
      setTimeout(checkSubscription, 2000);
    }
  }, [user, checkSubscription]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    setImpersonating(null);
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ name: data.name, total_limit: data.total_limit })
      .eq("user_id", user.id);
    await fetchProfile(user.id);
  };

  const impersonateUser = async (email: string) => {
    if (!isAdmin) return { error: "Sem permissão" };
    const { data, error } = await supabase.rpc("get_user_by_email", { _email: email });
    if (error || !data || (data as any[]).length === 0) return { error: "Usuário não encontrado" };
    const target = (data as any[])[0];
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", target.user_id)
      .single();
    if (prof) setImpersonating(prof as Profile);
    return {};
  };

  const stopImpersonating = () => setImpersonating(null);

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, isAdmin, loading,
        impersonating, activeProfile, activeUserId,
        subscription, checkSubscription,
        login, register, logout,
        updateProfile, refreshProfile, impersonateUser, stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
